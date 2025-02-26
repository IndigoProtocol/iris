import { BaseApiController } from './BaseApiController';
import express from 'express';
import { dbApiService } from '../../apiServices';
import { Brackets, EntityManager } from 'typeorm';
import { LiquidityPool } from '../../db/entities/LiquidityPool';
import { LiquidityPoolResource } from '../resources/LiquidityPoolResource';
import { LiquidityPoolSwap } from '../../db/entities/LiquidityPoolSwap';
import { LiquidityPoolSwapResource } from '../resources/LiquidityPoolSwapResource';
import { OperationStatus } from '../../db/entities/OperationStatus';
import { LiquidityPoolDeposit } from '../../db/entities/LiquidityPoolDeposit';
import { LiquidityPoolDepositResource } from '../resources/LiquidityPoolDepositResource';
import { LiquidityPoolWithdraw } from '../../db/entities/LiquidityPoolWithdraw';
import { LiquidityPoolWithdrawResource } from '../resources/LiquidityPoolWithdrawResource';
import { LiquidityPoolTick } from '../../db/entities/LiquidityPoolTick';
import { LiquidityPoolTickResource } from '../resources/LiquidityPoolTickResource';
import { TickInterval } from '../../constants';
import { unixTimeToSlot, stakeCredentialOf, paymentCredentialOf } from '@lucid-evolution/lucid';
import { LiquidityPoolState } from '../../db/entities/LiquidityPoolState';
import { LiquidityPoolStateResource } from '../resources/LiquidityPoolStateResource';
import { Asset } from '../../db/entities/Asset';

const MAX_PER_PAGE: number = 100;

export class LiquidityPoolController extends BaseApiController {

    public bootRoutes(): void {
        this.router.get(`${this.basePath}`, this.liquidityPools);
        this.router.post(`${this.basePath}`, this.liquidityPools);
        this.router.get(`${this.basePath}/search`, this.search);

        this.router.post(`${this.basePath}/prices`, this.liquidityPoolPrices);
        this.router.post(`${this.basePath}/swaps/historic`, this.swapsHistoric);
        this.router.post(`${this.basePath}/deposits/historic`, this.depositsHistoric);
        this.router.post(`${this.basePath}/withdraws/historic`, this.withdrawsHistoric);
        this.router.post(`${this.basePath}/states/historic`, this.liquidityPoolStatesHistoric);

        this.router.get(`${this.basePath}/:identifier`, this.liquidityPool);
        this.router.get(`${this.basePath}/:identifier/ticks`, this.liquidityPoolTicks);
        this.router.get(`${this.basePath}/:identifier/swaps`, this.liquidityPoolSwaps);
        this.router.get(`${this.basePath}/:identifier/deposits`, this.liquidityPoolDeposits);
        this.router.get(`${this.basePath}/:identifier/withdraws`, this.liquidityPoolWithdraws);
    }

    private swapsHistoric(request: express.Request, response: express.Response) {
        const {
            fromTimestamp,
            toTimestamp,
            forAssets,
        } = request.body;

        if (forAssets && ! (forAssets instanceof Array)) {
            return response.send(super.failResponse('Assets must be an array'));
        }

        const assets: Asset[] = ((forAssets ?? []) as string[]).map((identifier: string) => Asset.fromId(identifier));
        const policyIds: string[] = assets.map((asset: Asset) => asset.policyId);
        const nameHexs: string[] = assets.map((asset: Asset) => asset.nameHex);

        const fetchOrders: any = (manager: EntityManager) => {
            return manager.createQueryBuilder(LiquidityPoolSwap, 'swaps')
                .leftJoinAndSelect('swaps.swapInToken', 'swapInToken')
                .leftJoinAndSelect('swaps.swapOutToken', 'swapOutToken')
                .leftJoinAndMapMany(
                    'swaps.statuses',
                    OperationStatus,
                    'status',
                    'operationId = swaps.id AND operationType = :operationType',
                    {
                        operationType: LiquidityPoolSwap.name,
                    }
                )
                .andWhere(
                    new Brackets((query) => {
                        if (assets.length > 0) {
                            query.andWhere('(swapInToken.policyId IN(:policyIds) AND swapInToken.nameHex IN(:nameHexs)) OR (swapOutToken.policyId IN(:policyIds) AND swapOutToken.nameHex IN(:nameHexs))', {
                                policyIds,
                                nameHexs,
                            });
                        }
                    })
                )
                .andWhere('swaps.slot >= :fromSlot', {
                    fromSlot: unixTimeToSlot("Mainnet", Number(fromTimestamp) * 1000)
                })
                .andWhere('swaps.slot < :toSlot', {
                    toSlot: unixTimeToSlot("Mainnet", Number(toTimestamp) * 1000)
                })
                .getMany();
        };

        return dbApiService.query(fetchOrders)
            .then((orders) => {
                const resource: LiquidityPoolSwapResource = new LiquidityPoolSwapResource();

                return response.send(resource.manyToJson(orders));
            }).catch((e) => response.send(super.failResponse(e)));
    }

    private liquidityPoolStatesHistoric(request: express.Request, response: express.Response) {
        const {
            fromTimestamp,
            toTimestamp,
            forAssets,
        } = request.body;

        if (forAssets && ! (forAssets instanceof Array)) {
            return response.send(super.failResponse('Assets must be an array'));
        }

        const assets: Asset[] = ((forAssets ?? []) as string[]).map((identifier: string) => Asset.fromId(identifier));
        const policyIds: string[] = assets.map((asset: Asset) => asset.policyId);
        const nameHexs: string[] = assets.map((asset: Asset) => asset.nameHex);

        const fetchStates: any = (manager: EntityManager) => {
            return manager.createQueryBuilder(LiquidityPoolState, 'states')
                .leftJoinAndSelect('states.liquidityPool', 'liquidityPool')
                .leftJoinAndSelect('liquidityPool.tokenA', 'tokenA')
                .leftJoinAndSelect('liquidityPool.tokenB', 'tokenB')
                .andWhere(
                    new Brackets((query) => {
                        if (assets.length > 0) {
                            query.andWhere('(tokenA.policyId IN(:policyIds) AND tokenA.nameHex IN(:nameHexs)) OR (tokenB.policyId IN(:policyIds) AND tokenB.nameHex IN(:nameHexs))', {
                                policyIds,
                                nameHexs,
                            });
                        }
                    })
                )
                .andWhere('states.slot >= :fromSlot', {
                    fromSlot: unixTimeToSlot("Mainnet", Number(fromTimestamp) * 1000)
                })
                .andWhere('states.slot < :toSlot', {
                    toSlot: unixTimeToSlot("Mainnet", Number(toTimestamp) * 1000)
                })
                .getMany();
        };

        return dbApiService.query(fetchStates)
            .then((states) => {
                const resource: LiquidityPoolStateResource = new LiquidityPoolStateResource();

                return response.send(resource.manyToJson(states));
            }).catch((e) => response.send(super.failResponse(e)));
    }

    private depositsHistoric(request: express.Request, response: express.Response) {
        const {
            fromTimestamp,
            toTimestamp,
            forAssets,
        } = request.body;

        if (forAssets && ! (forAssets instanceof Array)) {
            return response.send(super.failResponse('Assets must be an array'));
        }

        const assets: Asset[] = ((forAssets ?? []) as string[]).map((identifier: string) => Asset.fromId(identifier));
        const policyIds: string[] = assets.map((asset: Asset) => asset.policyId);
        const nameHexs: string[] = assets.map((asset: Asset) => asset.nameHex);

        const fetchOrders: any = (manager: EntityManager) => {
            return manager.createQueryBuilder(LiquidityPoolDeposit, 'deposits')
                .leftJoinAndSelect('deposits.depositAToken', 'depositAToken')
                .leftJoinAndSelect('deposits.depositBToken', 'depositBToken')
                .addSelect([
                    'depositAToken.policyId',
                    'depositAToken.nameHex',
                    'depositAToken.decimals',
                    'depositBToken.policyId',
                    'depositBToken.nameHex',
                    'depositBToken.decimals',
                ])
                .leftJoinAndMapMany(
                    'deposits.statuses',
                    OperationStatus,
                    'status',
                    'operationId = deposits.id AND operationType = :operationType',
                    {
                        operationType: LiquidityPoolDeposit.name,
                    }
                )
                .andWhere(
                    new Brackets((query) => {
                        if (assets.length > 0) {
                            query.andWhere('(depositAToken.policyId IN(:policyIds) AND depositAToken.nameHex IN(:nameHexs)) OR (depositBToken.policyId IN(:policyIds) AND depositBToken.nameHex IN(:nameHexs))', {
                                policyIds,
                                nameHexs,
                            });
                        }
                    })
                )
                .andWhere('deposits.slot >= :fromSlot', {
                    fromSlot: unixTimeToSlot("Mainnet", Number(fromTimestamp) * 1000)
                })
                .andWhere('deposits.slot < :toSlot', {
                    toSlot: unixTimeToSlot("Mainnet", Number(toTimestamp) * 1000)
                })
                .getMany();
        };

        return dbApiService.query(fetchOrders)
            .then((orders) => {
                const resource: LiquidityPoolDepositResource = new LiquidityPoolDepositResource();

                return response.send(resource.manyToJson(orders));
            }).catch((e) => response.send(super.failResponse(e)));
    }

    private withdrawsHistoric(request: express.Request, response: express.Response) {
        const {
            fromTimestamp,
            toTimestamp,
        } = request.body;

        const fetchOrders: any = (manager: EntityManager) => {
            return manager.createQueryBuilder(LiquidityPoolWithdraw, 'withdraws')
                .leftJoinAndSelect('withdraws.lpToken', 'lpToken')
                .addSelect([
                    'lpToken.policyId',
                    'lpToken.nameHex',
                    'lpToken.isLpToken',
                ])
                .leftJoinAndMapMany(
                    'withdraws.statuses',
                    OperationStatus,
                    'status',
                    'operationId = withdraws.id AND operationType = :operationType',
                    {
                        operationType: LiquidityPoolWithdraw.name,
                    }
                )
                .andWhere('withdraws.slot >= :fromSlot', {
                    fromSlot: unixTimeToSlot("Mainnet", Number(fromTimestamp) * 1000)
                })
                .andWhere('withdraws.slot < :toSlot', {
                    toSlot: unixTimeToSlot("Mainnet", Number(toTimestamp) * 1000)
                })
                .getMany();
        };

        return dbApiService.query(fetchOrders)
            .then((orders) => {
                const resource: LiquidityPoolWithdrawResource = new LiquidityPoolWithdrawResource();

                return response.send(resource.manyToJson(orders));
            }).catch((e) => response.send(super.failResponse(e)));
    }

    private liquidityPools(request: express.Request, response: express.Response) {
        const {
            identifier,
            dex,
            tokenA,
            tokenB,
            fromTimestamp,
            toTimestamp,
        } = request.body;
        const {
            page,
            limit,
        } = request.query;

        const take: number | undefined = fromTimestamp || toTimestamp
            ? undefined
            : Math.min(Number((limit ? +limit : undefined) || MAX_PER_PAGE), MAX_PER_PAGE);
        const skip: number | undefined = take
            ? (Math.max(Number((page ? +page : undefined) || 1), 1) - 1) * take
            : undefined;

        const [tokenAPolicyId, tokenANameHex] = tokenA && tokenA !== 'lovelace'
            ? (tokenA as string).split('.')
            : [null, null];
        const [tokenBPolicyId, tokenBNameHex] =  tokenB
            ? (tokenB as string).split('.')
            : [null, null];

        return dbApiService.query((manager: EntityManager) => {
            return manager.createQueryBuilder(LiquidityPool, 'pools')
                .leftJoinAndSelect('pools.tokenA', 'tokenA')
                .leftJoinAndSelect('pools.tokenB', 'tokenB')
                .leftJoinAndSelect('pools.latestState', 'latestState')
                .leftJoinAndSelect('latestState.tokenLp', 'tokenLp')
                .where(
                    new Brackets((query) => {
                        if (identifier) {
                            query.andWhere("pools.identifier = :identifier", {
                                identifier: identifier,
                            });
                        }

                        if (dex) {
                            query.andWhere("pools.dex = :dex", {
                                dex: dex,
                            });
                        }

                        if (tokenA === 'lovelace') {
                            query.andWhere('pools.tokenA IS NULL');
                        } else if (tokenAPolicyId && tokenANameHex) {
                            query.andWhere("tokenA.policyId = :policyId", {
                                policyId: tokenAPolicyId,
                            }).andWhere("tokenA.nameHex = :nameHex", {
                                nameHex: tokenANameHex,
                            });
                        }

                        if (tokenBPolicyId && tokenBNameHex) {
                            query.andWhere("tokenB.policyId = :policyId", {
                                policyId: tokenBPolicyId,
                            }).andWhere("tokenB.nameHex = :nameHex", {
                                nameHex: tokenBNameHex,
                            });
                        }

                        if (fromTimestamp) {
                            query.andWhere('pools.createdSlot >= :fromSlot', {
                                fromSlot: unixTimeToSlot("Mainnet", Number(fromTimestamp) * 1000)
                            });
                        }

                        if (toTimestamp) {
                            query.andWhere('pools.createdSlot < :toSlot', {
                                toSlot: unixTimeToSlot("Mainnet", Number(toTimestamp) * 1000)
                            });
                        }

                        return query;
                    }),
                )
                .orderBy('latestState.tvl', 'DESC')
                .limit(take)
                .offset(skip)
                .getManyAndCount();
        }).then(([liquidityPools, total]) => {
            const resource: LiquidityPoolResource = new LiquidityPoolResource();

            response.send(super.formatPaginatedResponse(
                Number(page ?? 1),
                Number(limit ?? MAX_PER_PAGE),
                Math.ceil(total / (take ?? 1)),
                resource.manyToJson(liquidityPools)
            ));
        }).catch(() => response.send(super.failResponse('Unable to retrieve liquidity pools')));
    }

    private liquidityPool(request: express.Request, response: express.Response) {
        const {
            identifier,
        } = request.params;

        if (! identifier) {
            return response.send(super.failResponse("Must supply 'identifier'"));
        }

        return dbApiService.query((manager: EntityManager) => {
            return manager.createQueryBuilder(LiquidityPool, 'pools')
                .leftJoinAndSelect('pools.tokenA', 'tokenA')
                .leftJoinAndSelect('pools.tokenB', 'tokenB')
                .leftJoinAndSelect('pools.latestState', 'latestState')
                .leftJoinAndSelect('latestState.tokenLp', 'tokenLp')
                .where('pools.identifier = :identifier', {
                    identifier,
                })
                .limit(1)
                .getOne();
        }).then((liquidityPool: LiquidityPool) => {
            const resource: LiquidityPoolResource = new LiquidityPoolResource();

            response.send(resource.toJson(liquidityPool));
        }).catch(() => response.send(super.failResponse('Unable to retrieve liquidity pool')));
    }

    private liquidityPoolTicks(request: express.Request, response: express.Response) {
        const {
            identifier,
        } = request.params;
        const {
            resolution,
            fromTime,
            toTime,
            orderBy,
        } = request.query;

        if (! identifier) {
            return response.send(super.failResponse("Must supply 'identifier'"));
        }
        if (! (Object.values(TickInterval) as string[]).includes(resolution as string)) {
            return response.send(super.failResponse(`Must supply 'resolution' as ${Object.values(TickInterval).join(',')}`));
        }
        if (orderBy && ! ['ASC', 'DESC'].includes(orderBy as string)) {
            return response.send(super.failResponse("orderBy must be 'ASC' or 'DESC'"));
        }

        const fetchTicks: any = (manager: EntityManager) => {
            return manager.findOneBy(LiquidityPool, {
                identifier,
            }).then((pool: LiquidityPool | null) => {
                if (! pool) {
                    return Promise.reject('Unable to find liquidity pool');
                }

                return manager.createQueryBuilder(LiquidityPoolTick, 'ticks')
                    .where(
                        new Brackets((query) => {
                            query.where('ticks.liquidityPoolId = :poolId', {
                                poolId: pool.id,
                            }).andWhere('ticks.resolution = :resolution', {
                                resolution,
                            });

                            if (fromTime && ! isNaN(parseInt(fromTime as string))) {
                                query.andWhere('ticks.time >= :fromTime', {
                                    fromTime: parseInt(fromTime as string),
                                });
                            }

                            if (toTime && ! isNaN(parseInt(toTime as string))) {
                                query.andWhere('ticks.time <= :toTime', {
                                    toTime: parseInt(toTime as string),
                                });
                            }

                            return query;
                        }),
                    )
                    .orderBy('time', orderBy ? (orderBy as 'ASC' | 'DESC') : 'ASC')
                    .getMany();
            });
        };

        return dbApiService.transaction(fetchTicks)
            .then((ticks: LiquidityPoolTick[]) => {
                const resource: LiquidityPoolTickResource = new LiquidityPoolTickResource();

                response.send(resource.manyToJson(ticks));
            }).catch((e) => response.send(super.failResponse(e)));
    }

    private async liquidityPoolSwaps(request: express.Request, response: express.Response) {
        const {
            identifier,
        } = request.params;
        const {
            type,
            page,
            limit,
            sender,
        } = request.query;

        const take: number = Math.min(Number((limit ? +limit : undefined) || MAX_PER_PAGE), MAX_PER_PAGE);
        const skip: number = (Math.max(Number((page ? +page : undefined) || 1), 1) - 1) * take;

        if (! identifier) {
            return response.send(super.failResponse("Must supply 'identifier'"));
        }

        const liquidityPool: LiquidityPool | null = await dbApiService.query((manager: EntityManager) => {
            return manager.createQueryBuilder(LiquidityPool, 'pools')
                .leftJoinAndSelect('pools.tokenA', 'tokenA')
                .leftJoinAndSelect('pools.tokenB', 'tokenB')
                .where('pools.identifier = :identifier', { identifier })
                .getOne();
        });

        if (! liquidityPool) {
            return response.send(super.failResponse('Unable to find liquidity pool'));
        }

        const fetchOrders: any = (manager: EntityManager) => {
            return manager.createQueryBuilder(LiquidityPoolSwap, 'swaps')
                .leftJoinAndSelect('swaps.swapInToken', 'swapInToken')
                .leftJoinAndSelect('swaps.swapOutToken', 'swapOutToken')
                .leftJoinAndMapMany(
                    'swaps.statuses',
                    OperationStatus,
                    'status',
                    'operationId = swaps.id AND operationType = :operationType',
                    {
                        operationType: LiquidityPoolSwap.name,
                    }
                )
                .where('swaps.liquidityPoolId = :poolId', {
                    poolId: liquidityPool.id,
                })
                .andWhere(
                    new Brackets((query) => {
                        if (sender) {
                            if ((sender as string).startsWith('addr')) {
                                query.where('swaps.senderPubKeyHash = :hash', {
                                    hash: paymentCredentialOf(sender as string).hash
                                }).orWhere('swaps.senderStakeKeyHash = :hash', {
                                    hash: stakeCredentialOf(sender as string).hash
                                });
                            } else {
                                query.where('swaps.senderPubKeyHash = :hash', {
                                    hash: sender
                                });
                            }
                        }

                        if (type && type === 'buy') {
                            if (! liquidityPool.tokenA) {
                                query.andWhere('swaps.swapInTokenId IS NULL');
                            } else {
                                query.andWhere('swaps.swapInTokenId = :tokenAId', { tokenAId: liquidityPool.tokenA?.id ?? 0 });
                            }
                        }
                        if (type && type === 'sell') {
                            if (! liquidityPool.tokenA) {
                                query.andWhere('swaps.swapOutTokenId IS NULL');
                            } else {
                                query.andWhere('swaps.swapOutTokenId = :tokenAId', { tokenAId: liquidityPool.tokenA?.id ?? 0 });
                            }
                        }

                        return query;
                    }),
                )
                .orderBy('swaps.id', 'DESC')
                .take(take)
                .skip(skip)
                .getManyAndCount();
        };

        return dbApiService.query(fetchOrders)
            .then(([swaps, total]) => {
                const resource: LiquidityPoolSwapResource = new LiquidityPoolSwapResource();

                swaps.forEach((order: LiquidityPoolSwap) => order.liquidityPool = liquidityPool);

                response.send(super.formatPaginatedResponse(
                    Number(page ?? 1),
                    Number(limit ?? MAX_PER_PAGE),
                    Math.ceil(total / take),
                    resource.manyToJson(swaps)
                ));
            }).catch((e) => {
                console.error(e)
                response.send(super.failResponse(e))
            });
    }

    private async liquidityPoolDeposits(request: express.Request, response: express.Response) {
        const {
            identifier,
        } = request.params;
        const {
            page,
            limit,
            sender,
        } = request.query;

        const take: number = Math.min(Number((limit ? +limit : undefined) || MAX_PER_PAGE), MAX_PER_PAGE);
        const skip: number = (Math.max(Number((page ? +page : undefined) || 1), 1) - 1) * take;

        if (! identifier) {
            return response.send(super.failResponse("Must supply 'identifier'"));
        }

        const liquidityPool: LiquidityPool | null = await dbApiService.query((manager: EntityManager) => {
            return manager.createQueryBuilder(LiquidityPool, 'pools')
                .leftJoinAndSelect('pools.tokenA', 'tokenA')
                .leftJoinAndSelect('pools.tokenB', 'tokenB')
                .where('pools.identifier = :identifier', { identifier })
                .getOne();
        });

        if (! liquidityPool) {
            return response.send(super.failResponse('Unable to find liquidity pool'));
        }

        const fetchOrders: any = (manager: EntityManager) => {
            return manager.createQueryBuilder(LiquidityPoolDeposit, 'deposits')
                .leftJoinAndSelect('deposits.depositAToken', 'depositAToken')
                .leftJoinAndSelect('deposits.depositBToken', 'depositBToken')
                .leftJoinAndMapMany(
                    'deposits.statuses',
                    OperationStatus,
                    'status',
                    'operationId = deposits.id AND operationType = :operationType',
                    {
                        operationType: LiquidityPoolDeposit.name,
                    }
                )
                .where('deposits.liquidityPoolId = :poolId', {
                    poolId: liquidityPool.id,
                })
                .andWhere(
                    new Brackets((query) => {
                        if (sender) {
                            if ((sender as string).startsWith('addr')) {
                                query.where('deposits.senderPubKeyHash = :hash', {
                                    hash: paymentCredentialOf(sender as string).hash
                                }).orWhere('deposits.senderStakeKeyHash = :hash', {
                                    hash: stakeCredentialOf(sender as string).hash
                                });
                            } else {
                                query.where('deposits.senderPubKeyHash = :hash', {
                                    hash: sender
                                });
                            }
                        }

                        return query;
                    }),
                )
                .orderBy('deposits.id', 'DESC')
                .take(take)
                .skip(skip)
                .getManyAndCount();
        };

        return dbApiService.query(fetchOrders)
            .then(([deposits, total]) => {
                const resource: LiquidityPoolDepositResource = new LiquidityPoolDepositResource();

                deposits.forEach((order: LiquidityPoolSwap) => order.liquidityPool = liquidityPool);

                response.send(super.formatPaginatedResponse(
                    Number(page ?? 1),
                    Number(limit ?? MAX_PER_PAGE),
                    Math.ceil(total / take),
                    resource.manyToJson(deposits)
                ));
            }).catch((e) => response.send(super.failResponse(e)));
    }

    private async liquidityPoolWithdraws(request: express.Request, response: express.Response) {
        const {
            identifier,
        } = request.params;
        const {
            page,
            limit,
            sender,
        } = request.query;

        const take: number = Math.min(Number((limit ? +limit : undefined) || MAX_PER_PAGE), MAX_PER_PAGE);
        const skip: number = (Math.max(Number((page ? +page : undefined) || 1), 1) - 1) * take;

        if (! identifier) {
            return response.send(super.failResponse("Must supply 'identifier'"));
        }

        const liquidityPool: LiquidityPool | null = await dbApiService.query((manager: EntityManager) => {
            return manager.createQueryBuilder(LiquidityPool, 'pools')
                .leftJoinAndSelect('pools.tokenA', 'tokenA')
                .leftJoinAndSelect('pools.tokenB', 'tokenB')
                .where('pools.identifier = :identifier', { identifier })
                .getOne();
        });

        if (! liquidityPool) {
            return response.send(super.failResponse('Unable to find liquidity pool'));
        }

        const fetchOrders: any = (manager: EntityManager) => {
            return manager.createQueryBuilder(LiquidityPoolWithdraw, 'withdraws')
                .leftJoinAndSelect('withdraws.lpToken', 'lpToken')
                .leftJoinAndMapMany(
                    'withdraws.statuses',
                    OperationStatus,
                    'status',
                    'operationId = withdraws.id AND operationType = :operationType',
                    {
                        operationType: LiquidityPoolWithdraw.name,
                    }
                )
                .where('withdraws.liquidityPoolId = :poolId', {
                    poolId: liquidityPool.id,
                })
                .andWhere(
                    new Brackets((query) => {
                        if (sender) {
                            if ((sender as string).startsWith('addr')) {
                                query.where('withdraws.senderPubKeyHash = :hash', {
                                    hash: paymentCredentialOf(sender as string).hash
                                }).orWhere('withdraws.senderStakeKeyHash = :hash', {
                                    hash: stakeCredentialOf(sender as string).hash
                                });
                            } else {
                                query.where('withdraws.senderPubKeyHash = :hash', {
                                    hash: sender
                                });
                            }
                        }

                        return query;
                    }),
                )
                .orderBy('withdraws.id', 'DESC')
                .take(take)
                .skip(skip)
                .getManyAndCount();
        };

        return dbApiService.query(fetchOrders)
            .then(([withdraws, total]) => {
                const resource: LiquidityPoolWithdrawResource = new LiquidityPoolWithdrawResource();

                withdraws.forEach((order: LiquidityPoolSwap) => order.liquidityPool = liquidityPool);

                response.send(super.formatPaginatedResponse(
                    Number(page ?? 1),
                    Number(limit ?? MAX_PER_PAGE),
                    Math.ceil(total / take),
                    resource.manyToJson(withdraws)
                ));
            }).catch((e) => response.send(super.failResponse(e)));
    }

    private search(request: express.Request, response: express.Response) {
        const {
            query,
            page,
            limit,
        } = request.query;

        const take: number = Math.min(Number((limit ? +limit : undefined) || MAX_PER_PAGE), MAX_PER_PAGE);
        const skip: number = (Math.max(Number((page ? +page : undefined) || 1), 1) - 1) * take;

        const searchQuery: string = '%' + (query as string)
            .replace(/[^a-z0-9\s]/gi, '')
            .toLowerCase() + '%';

        return dbApiService.query((manager: EntityManager) => {
            return manager.createQueryBuilder(LiquidityPool, 'pools')
                .leftJoinAndSelect('pools.tokenA', 'tokenA')
                .leftJoinAndSelect('pools.tokenB', 'tokenB')
                .andWhere(
                    new Brackets((query) => {
                        query.where("LOWER(tokenA.name) LIKE :query", {
                            query: searchQuery,
                        }).orWhere("tokenA.nameHex LIKE :query", {
                            query: searchQuery,
                        }).orWhere("tokenA.policyId LIKE :query", {
                            query: searchQuery,
                        }).orWhere("LOWER(tokenA.ticker) LIKE :query", {
                            query: searchQuery,
                        }).orWhere("LOWER(tokenB.name) LIKE :query", {
                            query: searchQuery,
                        }).orWhere("tokenB.nameHex LIKE :query", {
                            query: searchQuery,
                        }).orWhere("tokenB.policyId LIKE :query", {
                            query: searchQuery,
                        }).orWhere("LOWER(tokenB.ticker) LIKE :query", {
                            query: searchQuery,
                        });
                    }),
                )
                .take(take)
                .skip(skip)
                .getManyAndCount();
        }).then(([liquidityPools, total]) => {
            const resource: LiquidityPoolResource = new LiquidityPoolResource();

            response.send(super.formatPaginatedResponse(
                Number(page ?? 1),
                Number(limit ?? MAX_PER_PAGE),
                Math.ceil(total / take),
                resource.manyToJson(liquidityPools)
            ));
        }).catch(() => response.send(super.failResponse('Unable to search liquidity pools')));
    }

    private liquidityPoolPrices(request: express.Request, response: express.Response) {
        const {
            identifiers,
        } = request.body;

        if (! identifiers || identifiers.length === 0) {
             return response.send([]);
        }

        return dbApiService.query((manager: EntityManager) => {
            return manager.createQueryBuilder(LiquidityPool, 'pools')
                .leftJoinAndSelect('pools.tokenA', 'tokenA')
                .leftJoinAndSelect('pools.tokenB', 'tokenB')
                .leftJoinAndSelect('pools.latestState', 'latestState')
                .leftJoinAndMapOne(
                    'pools.day_tick',
                    LiquidityPoolTick,
                    'day_tick',
                    'day_tick.liquidityPoolId = pools.id AND (day_tick.id = (SELECT id FROM liquidity_pool_ticks WHERE liquidityPoolId = pools.id AND resolution = :resolution AND time >= (UNIX_TIMESTAMP() - :seconds) ORDER BY time ASC LIMIT 1))',
                    {
                        resolution: TickInterval.Hour,
                        seconds:  60 * 60 * 24,
                    },
                )
                .leftJoinAndMapOne(
                    'pools.hour_tick',
                    LiquidityPoolTick,
                    'hour_tick',
                    'hour_tick.liquidityPoolId = pools.id AND (hour_tick.id = (SELECT id FROM liquidity_pool_ticks WHERE liquidityPoolId = pools.id AND resolution = :hourResolution AND time >= (UNIX_TIMESTAMP() - :hourSeconds) ORDER BY time ASC LIMIT 1))',
                    {
                        hourResolution: TickInterval.Hour,
                        hourSeconds: 60 * 60,
                    },
                )
                .where('pools.identifier IN (:identifiers)', {
                    identifiers,
                })
                .getMany();
        }).then((results: any) => {
            response.send(
                results.reduce((prices: Object[], entry: any) => {
                    if (! entry.latestState) return prices;

                    const tokenADecimals: number = entry.tokenA ? entry.tokenA.decimals : 6;
                    const tokenBDecimals: number = entry.tokenB.decimals ?? 0;

                    const price: number = (entry.latestState.reserveA / 10**tokenADecimals) / (entry.latestState.reserveB / 10**tokenBDecimals);

                    prices.push({
                        identifier: entry.identifier,
                        price: price,
                        dayLow: entry.day_tick ? Math.min(entry.day_tick.low, price) : price,
                        dayHigh: entry.day_tick ? Math.max(entry.day_tick.high, price) : price,
                        dayChange: ! entry.day_tick ? 0 : (price - entry.day_tick.close) / entry.day_tick.close * 100,
                        hourChange: ! entry.hour_tick ? 0 : (price - entry.hour_tick.open) / entry.hour_tick.open * 100,
                    });

                    return prices;
                }, [])
            );
        }).catch(() => response.send(super.failResponse('Unable to retrieve liquidity pool prices')));
    }

}
