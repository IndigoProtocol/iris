import { BaseEventListener } from './BaseEventListener';
import { DexOperationStatus, IndexerEventType } from '../constants';
import { AmmDexOperation, IndexerEvent, StatusableEntity, TokenMetadata } from '../types';
import { logInfo } from '../logger';
import { dbService, eventService, metadataService, operationWs, queue } from '../indexerServices';
import { LiquidityPoolState } from '../db/entities/LiquidityPoolState';
import { LiquidityPool } from '../db/entities/LiquidityPool';
import { Asset } from '../db/entities/Asset';
import { BaseEntity, EntityManager, EntityTarget, IsNull } from 'typeorm';
import { LiquidityPoolSwap } from '../db/entities/LiquidityPoolSwap';
import { LiquidityPoolZap } from '../db/entities/LiquidityPoolZap';
import { LiquidityPoolDeposit } from '../db/entities/LiquidityPoolDeposit';
import { LiquidityPoolWithdraw } from '../db/entities/LiquidityPoolWithdraw';
import { stringify } from '../utils';
import CONFIG from '../config';
import { OperationStatus } from '../db/entities/OperationStatus';
import { UpdateLiquidityPoolTvlJob } from '../jobs/UpdateLiquidityPoolTvlJob';
import { UpdateTicksTotalTransactions } from '../jobs/UpdateTicksTotalTransactions';
import { UpdateAmountReceived } from '../jobs/UpdateAmountReceived';

const MAX_RESOLVE_ATTEMPTS: number = 3;

export class AmmDexOperationListener extends BaseEventListener {

    public listenFor: IndexerEventType[] = [
        IndexerEventType.AmmDexOperation,
    ];

    public async onEvent(event: IndexerEvent): Promise<any> {
        if (CONFIG.VERBOSE) {
            if ('dex' in event.data) {
                logInfo(`[${event.data.dex}] ${event.data.constructor.name} ${(event.data as AmmDexOperation).txHash}`);
            } else {
                logInfo(`${event.data.constructor.name} ${(event.data as AmmDexOperation).txHash}`);
            }
        }

        // Errors are handled within
        return this.eventHandler(event)
            .then((savedEntity: BaseEntity | undefined) => {

                if (savedEntity) {
                    operationWs.broadcast(savedEntity);
                }

                return Promise.resolve();
            })
            .catch(() => Promise.resolve());
    }

    /**
     * Store necessary data into the DB.
     */
    private async eventHandler(event: IndexerEvent): Promise<BaseEntity | undefined> {
        if (! dbService.isInitialized) {
            return Promise.resolve(undefined);
        }

        switch (event.data.constructor) {
            case LiquidityPoolState:
                return await this.handleUpdatedPoolState(event.data as LiquidityPoolState);
            case LiquidityPoolSwap:
                return await this.handleSwapOrder(event.data as LiquidityPoolSwap);
            case LiquidityPoolZap:
                return await this.handleZapOrder(event.data as LiquidityPoolZap);
            case LiquidityPoolDeposit:
                return await this.handlePoolDeposit(event.data as LiquidityPoolDeposit);
            case LiquidityPoolWithdraw:
                return await this.handlePoolWithdraw(event.data as LiquidityPoolWithdraw);
            case OperationStatus:
                return await this.handleOperationStatus(event.data as OperationStatus);
            default:
                return Promise.reject('Encountered unknown event type.');
        }
    }

    /**
     * Handle an update liquidity pool state event.
     */
    private async handleUpdatedPoolState(instance: LiquidityPoolState): Promise<any> {
        if (instance.tokenA) {
            instance.tokenA = await this.retrieveAsset(instance.tokenA);
        }
        instance.tokenB = await this.retrieveAsset(instance.tokenB);
        instance.tokenLp = await this.retrieveAsset(instance.tokenLp, true);

        const liquidityPool: LiquidityPool = await this.retrieveLiquidityPoolFromState(instance);
        instance.liquidityPool = liquidityPool;

        const updatedState: LiquidityPoolState = await dbService.transaction(async (manager: EntityManager): Promise<LiquidityPoolState> => {
            const newState: LiquidityPoolState = await manager.save(instance);

            liquidityPool.latestState = newState;

            return manager.save(liquidityPool)
                .then(() => newState);
        });

        queue.dispatch(new UpdateLiquidityPoolTvlJob(updatedState));

        return Promise.all(
            instance.possibleOperationInputs.map((status: OperationStatus) => {
                return this.handleOperationStatus(status)
                    .catch(() => Promise.resolve(undefined));
            })
        ).then((statuses: (OperationStatus | undefined)[]) => {
            statuses = statuses.filter((status: OperationStatus | undefined) => status !== undefined);

            if (statuses.length > 0) {
                instance.possibleOperationInputs = statuses as OperationStatus[];
                queue.dispatch(new UpdateAmountReceived(instance));
            }

            return Promise.resolve(updatedState);
        });
    }

    /**
     * Handle new swap order event.
     */
    private async handleSwapOrder(order: LiquidityPoolSwap): Promise<any> {
        if (order.swapInToken) {
            order.swapInToken = await this.retrieveAsset(order.swapInToken);
        }
        if (order.swapOutToken) {
            order.swapOutToken = await this.retrieveAsset(order.swapOutToken);
        }

        const retrievePool: any = async (manager: EntityManager, attempt: number = 0) => {
            if (attempt === MAX_RESOLVE_ATTEMPTS) {
                return Promise.reject(`Unable to find liquidity pool. ${stringify(order)}`);
            }

            const liquidityPool: LiquidityPool | undefined = await manager.findOne(LiquidityPool, {
                where: order.liquidityPoolIdentifier
                    ? [{
                        dex: order.dex,
                        identifier: order.liquidityPoolIdentifier,
                    }]
                    : [{
                        dex: order.dex,
                        tokenA: {
                            id: order.swapInToken ? order.swapInToken.id : IsNull(),
                        },
                        tokenB: {
                            id: order.swapOutToken ? order.swapOutToken.id : IsNull(),
                        },
                    }, {
                        dex: order.dex,
                        tokenA: {
                            id: order.swapOutToken ? order.swapOutToken.id : IsNull(),
                        },
                        tokenB: {
                            id: order.swapInToken ? order.swapInToken.id : IsNull(),
                        },
                    }],
            }) ?? undefined;

            if (liquidityPool) {
                order.liquidityPool = liquidityPool;

                return await manager.save(order)
                    .then(async (entity: LiquidityPoolSwap) => {
                        await this.handleOperationStatus(
                            OperationStatus.make(
                                DexOperationStatus.OnChain,
                                entity.slot,
                                entity.txHash,
                                entity.outputIndex,
                                order.txHash,
                                order.outputIndex,
                                entity.id,
                                entity.constructor.name,
                            )
                        );

                        queue.dispatch(new UpdateTicksTotalTransactions(liquidityPool, order.slot));

                        return Promise.resolve(entity);
                    });
            }

            return retrievePool(manager, attempt + 1);
        }

        return await dbService.query(retrievePool);
    }

    /**
     * Handle new zap order event.
     */
    private async handleZapOrder(order: LiquidityPoolZap): Promise<any> {
        if (order.swapInToken) {
            order.swapInToken = await this.retrieveAsset(order.swapInToken);
        }
        if (order.forToken) {
            order.forToken = await this.retrieveAsset(order.forToken);
        }

        const retrievePool: any = async (manager: EntityManager, attempt: number = 0) => {
            if (attempt === MAX_RESOLVE_ATTEMPTS) {
                return Promise.reject(`Unable to find liquidity pool. ${stringify(order)}`);
            }

            const liquidityPool: LiquidityPool | undefined = await manager.findOne(LiquidityPool, {
                where: order.liquidityPoolIdentifier
                    ? [{
                        dex: order.dex,
                        identifier: order.liquidityPoolIdentifier,
                    }]
                    : [{
                        dex: order.dex,
                        tokenA: {
                            id: order.swapInToken ? order.swapInToken.id : IsNull(),
                        },
                        tokenB: {
                            id: order.forToken ? order.forToken.id : IsNull(),
                        },
                    }, {
                        dex: order.dex,
                        tokenA: {
                            id: order.forToken ? order.forToken.id : IsNull(),
                        },
                        tokenB: {
                            id: order.swapInToken ? order.swapInToken.id : IsNull(),
                        },
                    }],
            }) ?? undefined;

            if (liquidityPool) {
                order.liquidityPool = liquidityPool;

                return await manager.save(order)
                    .then(async (entity: LiquidityPoolZap) => {
                        await this.handleOperationStatus(
                            OperationStatus.make(
                                DexOperationStatus.OnChain,
                                entity.slot,
                                entity.txHash,
                                entity.outputIndex,
                                order.txHash,
                                order.outputIndex,
                                entity.id,
                                entity.constructor.name,
                            )
                        );

                        queue.dispatch(new UpdateTicksTotalTransactions(liquidityPool, order.slot));

                        return Promise.resolve(entity);
                    });
            }

            return retrievePool(manager, attempt + 1);
        }

        return await dbService.transaction(retrievePool);
    }

    /**
     * Handle new liquidity deposit event.
     */
    private async handlePoolDeposit(deposit: LiquidityPoolDeposit): Promise<any> {
        if (deposit.depositAToken) {
            deposit.depositAToken = await this.retrieveAsset(deposit.depositAToken);
        }
        if (deposit.depositBToken) {
            deposit.depositBToken = await this.retrieveAsset(deposit.depositBToken);
        }

        const retrievePool: any = async (manager: EntityManager, attempt: number = 0) => {
            if (attempt === MAX_RESOLVE_ATTEMPTS) {
                return Promise.reject(`Unable to find liquidity pool. ${stringify(deposit)}`);
            }

            const liquidityPool: LiquidityPool | undefined = await manager.findOne(LiquidityPool, {
                where: deposit.liquidityPoolIdentifier
                    ? [{
                        dex: deposit.dex,
                        identifier: deposit.liquidityPoolIdentifier,
                    }]
                    : [{
                        dex: deposit.dex,
                        tokenA: {
                            id: deposit.depositAToken ? deposit.depositAToken.id : IsNull(),
                        },
                        tokenB: {
                            id: deposit.depositBToken ? deposit.depositBToken.id : IsNull(),
                        },
                    }, {
                        dex: deposit.dex,
                        tokenA: {
                            id: deposit.depositBToken ? deposit.depositBToken.id : IsNull(),
                        },
                        tokenB: {
                            id: deposit.depositAToken ? deposit.depositAToken.id : IsNull(),
                        },
                    }],
            }) ?? undefined;

            if (liquidityPool) {
                deposit.liquidityPool = liquidityPool;

                return await manager.save(deposit)
                    .then(async (entity: LiquidityPoolDeposit) => {
                        await this.handleOperationStatus(
                            OperationStatus.make(
                                DexOperationStatus.OnChain,
                                entity.slot,
                                entity.txHash,
                                entity.outputIndex,
                                deposit.txHash,
                                deposit.outputIndex,
                                entity.id,
                                entity.constructor.name,
                            )
                        );

                        queue.dispatch(new UpdateTicksTotalTransactions(liquidityPool, deposit.slot));

                        return Promise.resolve(entity);
                    });
            }

            return retrievePool(manager, attempt + 1);
        }

        return await dbService.transaction(retrievePool);
    }

    /**
     * Handle new liquidity withdraw event.
     */
    private async handlePoolWithdraw(withdraw: LiquidityPoolWithdraw): Promise<any> {
        withdraw.lpToken = await this.retrieveAsset(withdraw.lpToken, true);

        const retrievePool: any = async (manager: EntityManager, attempt: number = 0) => {
            if (attempt === MAX_RESOLVE_ATTEMPTS) {
                return Promise.reject(`Unable to find liquidity pool. ${stringify(withdraw)}`);
            }

            const liquidityPoolState: LiquidityPoolState | undefined = await manager.findOne(LiquidityPoolState, {
                relations: [
                  'liquidityPool',
                  'tokenLp',
                ],
                where: [
                    withdraw.liquidityPoolIdentifier
                        ? {
                            liquidityPool: {
                                dex: withdraw.dex,
                                identifier: withdraw.liquidityPoolIdentifier,
                            },
                        }
                        : {
                            tokenLp: {
                                id: withdraw.lpToken.id
                            },
                        }
                ],
            }) ?? undefined;

            if (liquidityPoolState) {
                withdraw.liquidityPool = liquidityPoolState.liquidityPool;

                return await manager.save(withdraw)
                    .then(async (entity: LiquidityPoolWithdraw) => {
                        await this.handleOperationStatus(
                            OperationStatus.make(
                                DexOperationStatus.OnChain,
                                entity.slot,
                                entity.txHash,
                                entity.outputIndex,
                                withdraw.txHash,
                                withdraw.outputIndex,
                                entity.id,
                                entity.constructor.name,
                            )
                        );

                        queue.dispatch(new UpdateTicksTotalTransactions(withdraw.liquidityPool as LiquidityPool, withdraw.slot));

                        return Promise.resolve(entity);
                    });
            }

            return retrievePool(manager, attempt + 1);
        }

        return await dbService.transaction(retrievePool);
    }

    /**
     * Update operation statuses to cancelled state.
     */
    private async handleOperationStatus(operationStatus: OperationStatus): Promise<any> {
        if (! operationStatus.operationId || ! operationStatus.operationType) {
            const entity: StatusableEntity | undefined = await this.retrieveOperationEntity(operationStatus.operationTxHash, operationStatus.operationOutputIndex);

            if (! entity) {
                return Promise.reject(`Unable to find entity with Tx hash ${operationStatus.operationTxHash}#${operationStatus.operationOutputIndex}`);
            }

            operationStatus.operationId = entity.id;
            operationStatus.operationType = entity.constructor.name;
        }

        return await dbService.transaction(async (manager: EntityManager): Promise<OperationStatus> => {
            return await manager.save(operationStatus);
        });
    }

    /**
     * Search for the DEX operation associated with a Tx#index.
     */
    private async retrieveOperationEntity(txHash: string, outputIndex: number): Promise<StatusableEntity | undefined> {
        const retrieveEntity = async (manager: EntityManager, entityTarget: EntityTarget<StatusableEntity>): Promise<StatusableEntity | undefined> => {
            return await manager.findOneBy(entityTarget, {
                txHash: txHash,
                outputIndex: outputIndex,
            }) ?? undefined;
        };

        return dbService.query(async (manager: EntityManager): Promise<any> => {
            return await retrieveEntity(manager, LiquidityPoolSwap)
                ?? await retrieveEntity(manager, LiquidityPoolDeposit)
                ?? await retrieveEntity(manager, LiquidityPoolWithdraw)
                ?? await retrieveEntity(manager, LiquidityPoolZap);
        });
    }

    /**
     * Helper to retrieve an Asset instance from the DB.
     * Note - Will store new asset instance if not found.
     */
    private async retrieveAsset(asset: Asset, isLpToken: boolean = false): Promise<Asset> {
        const firstOrSaveAsset: any = async (manager: EntityManager) => {
            const existingAsset: Asset | undefined = await manager
                .findOneBy(Asset, {
                    policyId: asset.policyId,
                    nameHex: asset.nameHex,
                }) ?? undefined;

            if (existingAsset) {
                return Promise.resolve(existingAsset);
            }

            asset.isLpToken = isLpToken;
            if (isLpToken) {
                asset.decimals = 0;
            } else {
                const assetMetadata: TokenMetadata | undefined = await metadataService.fetchAsset(asset.policyId, asset.nameHex)
                    .catch(() => undefined);

                if (assetMetadata) {
                    asset.name = assetMetadata.name;
                    asset.decimals = assetMetadata.decimals;
                    asset.ticker = assetMetadata.ticker;
                    asset.logo = assetMetadata.logo;
                    asset.description = assetMetadata.description;
                    asset.isVerified = true;
                } else {
                    asset.decimals = 0;
                }
            }

            return await manager.save(asset)
                .then(() => {
                    operationWs.broadcast(asset);
                    eventService.pushEvent({
                        type: IndexerEventType.Asset,
                        data: asset,
                    });

                    return Promise.resolve(asset);
                });
        };

        return await dbService.query(firstOrSaveAsset);
    }

    /**
     * Helper to retrieve the corresponding LiquidityPool in the DB for an updated state.
     * Note - Will store new pool instance if not found.
     */
    private async retrieveLiquidityPoolFromState(state: LiquidityPoolState): Promise<LiquidityPool> {
        const firstOrSavePool: any = async (manager: EntityManager) => {
            let existingPool: LiquidityPool | undefined = await manager
                .findOneBy(LiquidityPool, {
                    dex: state.dex,
                    identifier: state.liquidityPoolIdentifier,
                }) ?? undefined;

            if (existingPool) {
                existingPool.address = state.address;

                return await manager.save(existingPool);
            }

            const liquidityPool: LiquidityPool = LiquidityPool.make(
                state.dex,
                state.liquidityPoolIdentifier,
                state.address,
                state.tokenA,
                state.tokenB,
                state.slot,
            );

            return await manager.save(liquidityPool)
                .then(() => {
                    operationWs.broadcast(liquidityPool);
                    eventService.pushEvent({
                        type: IndexerEventType.LiquidityPool,
                        data: liquidityPool,
                    });

                    return Promise.resolve(liquidityPool);
                });
        };

        return await dbService.query(firstOrSavePool);
    }

}
