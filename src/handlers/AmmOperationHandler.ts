import { BaseEntity, EntityManager, EntityTarget, IsNull } from 'typeorm';
import CONFIG from '../config';
import { DexOperationStatus } from '../constants';
import { Asset } from '../db/entities/Asset';
import { LiquidityPool } from '../db/entities/LiquidityPool';
import { LiquidityPoolDeposit } from '../db/entities/LiquidityPoolDeposit';
import { LiquidityPoolState } from '../db/entities/LiquidityPoolState';
import { LiquidityPoolSwap } from '../db/entities/LiquidityPoolSwap';
import { LiquidityPoolWithdraw } from '../db/entities/LiquidityPoolWithdraw';
import { LiquidityPoolZap } from '../db/entities/LiquidityPoolZap';
import { OperationStatus } from '../db/entities/OperationStatus';
import {
  dbService,
  eventService,
  metadataService,
  operationWs,
  queue,
} from '../indexerServices';
import { UpdateAmountReceived } from '../jobs/UpdateAmountReceived';
import { UpdateLiquidityPoolTvlJob } from '../jobs/UpdateLiquidityPoolTvlJob';
import { logError, logInfo } from '../logger';
import { AmmDexOperation, StatusableEntity, TokenMetadata } from '../types';
import { stringify } from '../utils';

const MAX_RESOLVE_ATTEMPTS: number = 3;

export class AmmOperationHandler {
  public async handle(operation: AmmDexOperation): Promise<any> {
    if (CONFIG.VERBOSE) {
      if ('dex' in operation) {
        logInfo(
          `[${operation.dex}] ${operation.constructor.name} ${
            (operation as AmmDexOperation).txHash
          }`
        );
      } else {
        logInfo(
          `${operation.constructor.name} ${
            (operation as AmmDexOperation).txHash
          }`
        );
      }
    }

    // Errors are handled within
    return this.handleOperation(operation)
      .then((savedEntity: BaseEntity | undefined) => {
        if (savedEntity) {
          operationWs.broadcast(savedEntity);
        }

        return Promise.resolve();
      })
      .catch((e: any) => {
        logError(e);

        return Promise.resolve();
      });
  }

  /**
   * Store necessary data into the DB.
   */
  private async handleOperation(
    operation: AmmDexOperation
  ): Promise<BaseEntity | undefined> {
    if (!dbService.isInitialized) {
      return Promise.resolve(undefined);
    }

    switch (operation.constructor) {
      case LiquidityPoolState:
        return await this.handleUpdatedPoolState(
          operation as LiquidityPoolState
        );
      case LiquidityPoolSwap:
        return await this.handleSwapOrder(operation as LiquidityPoolSwap);
      case LiquidityPoolZap:
        return await this.handleZapOrder(operation as LiquidityPoolZap);
      case LiquidityPoolDeposit:
        return await this.handlePoolDeposit(operation as LiquidityPoolDeposit);
      case LiquidityPoolWithdraw:
        return await this.handlePoolWithdraw(
          operation as LiquidityPoolWithdraw
        );
      case OperationStatus:
        return await this.handleOperationStatus(operation as OperationStatus);
      default:
        return Promise.reject('Encountered unknown event type.');
    }
  }

  /**
   * Handle an update liquidity pool state event.
   */
  private async handleUpdatedPoolState(
    instance: LiquidityPoolState
  ): Promise<any> {
    if (instance.tokenA) {
      instance.tokenA = await this.retrieveAsset(instance.tokenA);
    }
    instance.tokenB = await this.retrieveAsset(instance.tokenB);
    instance.tokenLp = await this.retrieveAsset(instance.tokenLp, true);

    const liquidityPool: LiquidityPool =
      await this.retrieveLiquidityPoolFromState(instance);
    instance.liquidityPool = liquidityPool;

    const updatedState: LiquidityPoolState = await dbService.transaction(
      async (manager: EntityManager): Promise<LiquidityPoolState> => {
        const newState: LiquidityPoolState = await manager.save(instance);

        liquidityPool.latestState = newState;

        return manager.save(liquidityPool).then(() => newState);
      }
    );

    eventService.pushEvent({
      type: 'LiquidityPoolStateCreated',
      data: updatedState,
    });

    queue.dispatch(new UpdateLiquidityPoolTvlJob(updatedState));

    return Promise.all(
      instance.possibleOperationInputs.map((status: OperationStatus) => {
        return this.handleOperationStatus(status)
          .then((savedStatus: OperationStatus) => {
            operationWs.broadcast(savedStatus);

            return savedStatus;
          })
          .catch(() => Promise.resolve(undefined));
      })
    ).then((statuses: (OperationStatus | undefined)[]) => {
      statuses = statuses.filter(
        (status: OperationStatus | undefined) => status !== undefined
      );

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

    if (!order.swapInToken && !order.swapOutToken) {
      return Promise.reject(
        `Neither order tokens are set. ${stringify(order)}`
      );
    }

    const retrievePool: any = async (
      manager: EntityManager,
      attempt: number = 0
    ) => {
      if (attempt === MAX_RESOLVE_ATTEMPTS) {
        return Promise.reject(`Unable to find liquidity pool. ${order.txHash}`);
      }

      const liquidityPool: LiquidityPool | undefined =
        (await manager.findOne(LiquidityPool, {
          relations: ['tokenA', 'tokenB'],
          where: order.liquidityPoolIdentifier
            ? [
                {
                  dex: order.dex,
                  identifier: order.liquidityPoolIdentifier,
                },
                {
                  identifier: order.liquidityPoolIdentifier,
                },
              ]
            : [
                {
                  dex: order.dex,
                  tokenA: {
                    id: order.swapInToken ? order.swapInToken.id : IsNull(),
                  },
                  tokenB: {
                    id: order.swapOutToken ? order.swapOutToken.id : IsNull(),
                  },
                },
                {
                  dex: order.dex,
                  tokenA: {
                    id: order.swapOutToken ? order.swapOutToken.id : IsNull(),
                  },
                  tokenB: {
                    id: order.swapInToken ? order.swapInToken.id : IsNull(),
                  },
                },
                {
                  dex: order.backupDex,
                  tokenA: {
                    id: order.swapInToken ? order.swapInToken.id : IsNull(),
                  },
                  tokenB: {
                    id: order.swapOutToken ? order.swapOutToken.id : IsNull(),
                  },
                },
                {
                  dex: order.backupDex,
                  tokenA: {
                    id: order.swapOutToken ? order.swapOutToken.id : IsNull(),
                  },
                  tokenB: {
                    id: order.swapInToken ? order.swapInToken.id : IsNull(),
                  },
                },
              ],
        })) ?? undefined;

      if (liquidityPool) {
        liquidityPool.orderAddress = order.toAddress;

        await manager.save(liquidityPool);

        order.liquidityPool = liquidityPool;

        eventService.pushEvent({
          type: 'LiquidityPoolUpdated',
          data: liquidityPool,
        });
        eventService.pushEvent({
          type: 'LiquidityPoolSwapCreated',
          data: order,
        });

        return await manager
          .save(order)
          .then(async (entity: LiquidityPoolSwap) => {
            const status: OperationStatus = await this.handleOperationStatus(
              OperationStatus.make(
                DexOperationStatus.OnChain,
                entity.slot,
                entity.txHash,
                entity.outputIndex,
                order.txHash,
                order.outputIndex,
                entity.id,
                entity.constructor.name
              )
            );

            entity.statuses = [status];

            entity.transaction = order.transaction;

            return Promise.resolve(entity);
          });
      }

      return retrievePool(manager, attempt + 1);
    };

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

    const retrievePool: any = async (
      manager: EntityManager,
      attempt: number = 0
    ) => {
      if (attempt === MAX_RESOLVE_ATTEMPTS) {
        return Promise.reject(`Unable to find liquidity pool. ${order.txHash}`);
      }

      const liquidityPool: LiquidityPool | undefined =
        (await manager.findOne(LiquidityPool, {
          relations: ['tokenA', 'tokenB'],
          where: order.liquidityPoolIdentifier
            ? [
                {
                  dex: order.dex,
                  identifier: order.liquidityPoolIdentifier,
                },
                {
                  identifier: order.liquidityPoolIdentifier,
                },
              ]
            : [
                {
                  dex: order.dex,
                  tokenA: {
                    id: order.swapInToken ? order.swapInToken.id : IsNull(),
                  },
                  tokenB: {
                    id: order.forToken ? order.forToken.id : IsNull(),
                  },
                },
                {
                  dex: order.dex,
                  tokenA: {
                    id: order.forToken ? order.forToken.id : IsNull(),
                  },
                  tokenB: {
                    id: order.swapInToken ? order.swapInToken.id : IsNull(),
                  },
                },
                {
                  dex: order.backupDex,
                  tokenA: {
                    id: order.swapInToken ? order.swapInToken.id : IsNull(),
                  },
                  tokenB: {
                    id: order.forToken ? order.forToken.id : IsNull(),
                  },
                },
                {
                  dex: order.backupDex,
                  tokenA: {
                    id: order.forToken ? order.forToken.id : IsNull(),
                  },
                  tokenB: {
                    id: order.swapInToken ? order.swapInToken.id : IsNull(),
                  },
                },
              ],
        })) ?? undefined;

      if (liquidityPool) {
        order.liquidityPool = liquidityPool;

        eventService.pushEvent({
          type: 'LiquidityPoolZapCreated',
          data: order,
        });

        return await manager
          .save(order)
          .then(async (entity: LiquidityPoolZap) => {
            const status: OperationStatus = await this.handleOperationStatus(
              OperationStatus.make(
                DexOperationStatus.OnChain,
                entity.slot,
                entity.txHash,
                entity.outputIndex,
                order.txHash,
                order.outputIndex,
                entity.id,
                entity.constructor.name
              )
            );

            entity.statuses = [status];

            entity.transaction = order.transaction;

            return Promise.resolve(entity);
          });
      }

      return retrievePool(manager, attempt + 1);
    };

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

    const retrievePool: any = async (
      manager: EntityManager,
      attempt: number = 0
    ) => {
      if (attempt === MAX_RESOLVE_ATTEMPTS) {
        return Promise.reject(
          `Unable to find liquidity pool. ${deposit.txHash}`
        );
      }

      const liquidityPool: LiquidityPool | undefined =
        (await manager.findOne(LiquidityPool, {
          relations: ['tokenA', 'tokenB'],
          where: deposit.liquidityPoolIdentifier
            ? [
                {
                  dex: deposit.dex,
                  identifier: deposit.liquidityPoolIdentifier,
                },
                {
                  identifier: deposit.liquidityPoolIdentifier,
                },
              ]
            : [
                {
                  dex: deposit.dex,
                  tokenA: {
                    id: deposit.depositAToken
                      ? deposit.depositAToken.id
                      : IsNull(),
                  },
                  tokenB: {
                    id: deposit.depositBToken
                      ? deposit.depositBToken.id
                      : IsNull(),
                  },
                },
                {
                  dex: deposit.dex,
                  tokenA: {
                    id: deposit.depositBToken
                      ? deposit.depositBToken.id
                      : IsNull(),
                  },
                  tokenB: {
                    id: deposit.depositAToken
                      ? deposit.depositAToken.id
                      : IsNull(),
                  },
                },
                {
                  dex: deposit.backupDex,
                  tokenA: {
                    id: deposit.depositAToken
                      ? deposit.depositAToken.id
                      : IsNull(),
                  },
                  tokenB: {
                    id: deposit.depositBToken
                      ? deposit.depositBToken.id
                      : IsNull(),
                  },
                },
                {
                  dex: deposit.backupDex,
                  tokenA: {
                    id: deposit.depositBToken
                      ? deposit.depositBToken.id
                      : IsNull(),
                  },
                  tokenB: {
                    id: deposit.depositAToken
                      ? deposit.depositAToken.id
                      : IsNull(),
                  },
                },
              ],
        })) ?? undefined;

      if (liquidityPool) {
        deposit.liquidityPool = liquidityPool;

        eventService.pushEvent({
          type: 'LiquidityPoolDepositCreated',
          data: deposit,
        });

        return await manager
          .save(deposit)
          .then(async (entity: LiquidityPoolDeposit) => {
            const status: OperationStatus = await this.handleOperationStatus(
              OperationStatus.make(
                DexOperationStatus.OnChain,
                entity.slot,
                entity.txHash,
                entity.outputIndex,
                deposit.txHash,
                deposit.outputIndex,
                entity.id,
                entity.constructor.name
              )
            );

            entity.statuses = [status];

            entity.transaction = deposit.transaction;

            return Promise.resolve(entity);
          });
      }

      return retrievePool(manager, attempt + 1);
    };

    return await dbService.transaction(retrievePool);
  }

  /**
   * Handle new liquidity withdraw event.
   */
  private async handlePoolWithdraw(
    withdraw: LiquidityPoolWithdraw
  ): Promise<any> {
    withdraw.lpToken = await this.retrieveAsset(withdraw.lpToken, true);

    const retrievePool: any = async (
      manager: EntityManager,
      attempt: number = 0
    ) => {
      if (attempt === MAX_RESOLVE_ATTEMPTS) {
        return Promise.reject(
          `Unable to find liquidity pool. ${withdraw.txHash}`
        );
      }

      const liquidityPoolState: LiquidityPoolState | undefined =
        (await manager.findOne(LiquidityPoolState, {
          relations: [
            'liquidityPool',
            'liquidityPool.tokenA',
            'liquidityPool.tokenB',
            'tokenLp',
          ],
          where: withdraw.liquidityPoolIdentifier
            ? [
                {
                  liquidityPool: {
                    dex: withdraw.dex,
                    identifier: withdraw.liquidityPoolIdentifier,
                  },
                },
                {
                  liquidityPool: {
                    identifier: withdraw.liquidityPoolIdentifier,
                  },
                },
              ]
            : [
                {
                  tokenLp: {
                    id: withdraw.lpToken.id,
                  },
                },
              ],
        })) ?? undefined;

      if (liquidityPoolState) {
        withdraw.liquidityPool = liquidityPoolState.liquidityPool;

        eventService.pushEvent({
          type: 'LiquidityPoolWithdrawCreated',
          data: withdraw,
        });

        return await manager
          .save(withdraw)
          .then(async (entity: LiquidityPoolWithdraw) => {
            const status: OperationStatus = await this.handleOperationStatus(
              OperationStatus.make(
                DexOperationStatus.OnChain,
                entity.slot,
                entity.txHash,
                entity.outputIndex,
                withdraw.txHash,
                withdraw.outputIndex,
                entity.id,
                entity.constructor.name
              )
            );

            entity.statuses = [status];

            entity.transaction = withdraw.transaction;

            return Promise.resolve(entity);
          });
      }

      return retrievePool(manager, attempt + 1);
    };

    return await dbService.transaction(retrievePool);
  }

  /**
   * Update operation statuses to cancelled state.
   */
  private async handleOperationStatus(
    operationStatus: OperationStatus
  ): Promise<any> {
    if (!operationStatus.operationId || !operationStatus.operationType) {
      const entity: StatusableEntity | undefined =
        await this.retrieveOperationEntity(
          operationStatus.operationTxHash,
          operationStatus.operationOutputIndex
        );

      if (!entity) {
        return Promise.reject(
          `Unable to find entity with Tx hash ${operationStatus.operationTxHash}#${operationStatus.operationOutputIndex}`
        );
      }
      operationStatus.operationEntity = entity;
      operationStatus.operationId = entity.id;
      operationStatus.operationType = entity.constructor.name;
    }

    eventService.pushEvent({
      type: 'OperationStatusCreated',
      data: operationStatus,
    });

    return await dbService.transaction(
      async (manager: EntityManager): Promise<OperationStatus> => {
        return await manager.save(operationStatus);
      }
    );
  }

  /**
   * Search for the DEX operation associated with a Tx#index.
   */
  private async retrieveOperationEntity(
    txHash: string,
    outputIndex: number
  ): Promise<StatusableEntity | undefined> {
    const retrieveEntity = async (
      manager: EntityManager,
      entityTarget: EntityTarget<StatusableEntity>,
      relations: string[]
    ): Promise<StatusableEntity | undefined> => {
      return (
        (await manager.findOne(entityTarget, {
          relations: relations,
          where: {
            txHash: txHash,
            outputIndex: outputIndex,
          },
        })) ?? undefined
      );
    };

    return dbService.query(async (manager: EntityManager): Promise<any> => {
      return (
        (await retrieveEntity(manager, LiquidityPoolSwap, [
          'liquidityPool',
          'liquidityPool.tokenA',
          'liquidityPool.tokenB',
          'swapInToken',
          'swapOutToken',
        ])) ??
        (await retrieveEntity(manager, LiquidityPoolDeposit, [
          'liquidityPool',
          'liquidityPool.tokenA',
          'liquidityPool.tokenB',
          'depositAToken',
          'depositBToken',
        ])) ??
        (await retrieveEntity(manager, LiquidityPoolWithdraw, [
          'liquidityPool',
          'liquidityPool.tokenA',
          'liquidityPool.tokenB',
          'lpToken',
        ])) ??
        (await retrieveEntity(manager, LiquidityPoolZap, [
          'liquidityPool',
          'liquidityPool.tokenA',
          'liquidityPool.tokenB',
          'swapInToken',
          'forToken',
        ]))
      );
    });
  }

  /**
   * Helper to retrieve an Asset instance from the DB.
   * Note - Will store new asset instance if not found.
   */
  private async retrieveAsset(
    asset: Asset,
    isLpToken: boolean = false
  ): Promise<Asset> {
    const firstOrSaveAsset: any = async (manager: EntityManager) => {
      const existingAsset: Asset | undefined =
        (await manager.findOne(Asset, {
          where: {
            policyId: asset.policyId,
            nameHex: asset.nameHex,
          },
        })) ?? undefined;

      if (existingAsset) {
        return Promise.resolve(existingAsset);
      }

      asset.isLpToken = isLpToken;
      if (isLpToken) {
        asset.decimals = 0;
      } else {
        const assetMetadata: TokenMetadata | undefined = await metadataService
          .fetchAsset(asset.policyId, asset.nameHex)
          .catch(() => undefined);

        if (assetMetadata) {
          asset.name = assetMetadata.name.replace(
            /[\x00-\x08\x0E-\x1F\x7F-\uFFFF]/g,
            ''
          );
          asset.decimals = assetMetadata.decimals;
          asset.ticker = assetMetadata.ticker;
          asset.logo = assetMetadata.logo;
          asset.description = assetMetadata.description.replace(
            /[\x00-\x08\x0E-\x1F\x7F-\uFFFF]/g,
            ''
          );
          asset.isVerified = true;
        } else {
          asset.decimals = 0;
        }
      }

      eventService.pushEvent({
        type: 'AssetCreated',
        data: asset,
      });

      return await manager.save(asset).then(() => {
        operationWs.broadcast(asset);

        return Promise.resolve(asset);
      });
    };

    return await dbService.query(firstOrSaveAsset);
  }

  /**
   * Helper to retrieve the corresponding LiquidityPool in the DB for an updated state.
   * Note - Will store new pool instance if not found.
   */
  private async retrieveLiquidityPoolFromState(
    state: LiquidityPoolState
  ): Promise<LiquidityPool> {
    const firstOrSavePool: any = async (manager: EntityManager) => {
      let existingPool: LiquidityPool | undefined =
        (await manager.findOne(LiquidityPool, {
          relations: ['tokenA', 'tokenB'],
          where: {
            dex: state.dex,
            identifier: state.liquidityPoolIdentifier,
          },
        })) ?? undefined;

      if (existingPool) {
        existingPool.address = state.address;

        eventService.pushEvent({
          type: 'LiquidityPoolUpdated',
          data: existingPool,
        });

        return await manager.save(existingPool);
      }

      const liquidityPool: LiquidityPool = LiquidityPool.make(
        state.dex,
        state.liquidityPoolIdentifier,
        state.address,
        state.tokenA,
        state.tokenB,
        state.slot
      );

      eventService.pushEvent({
        type: 'LiquidityPoolCreated',
        data: liquidityPool,
      });

      return await manager.save(liquidityPool).then(() => {
        operationWs.broadcast(liquidityPool);

        return Promise.resolve(liquidityPool);
      });
    };

    return await dbService.query(firstOrSavePool);
  }
}
