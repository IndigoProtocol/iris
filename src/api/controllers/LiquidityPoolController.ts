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
import { lucidUtils } from '../../utils';

const MAX_PER_PAGE: number = 100;

export class LiquidityPoolController extends BaseApiController {

    public bootRoutes(): void {
        this.router.get(`${this.basePath}`, this.liquidityPools);
        this.router.post(`${this.basePath}`, this.liquidityPools);
        this.router.get(`${this.basePath}/search`, this.search);

        this.router.post(`${this.basePath}/analytics/prices`, this.liquidityPoolPrices);
        this.router.get(`${this.basePath}/analytics/newest`, this.newest);

        this.router.get(`${this.basePath}/:identifier`, this.liquidityPool);
        this.router.get(`${this.basePath}/:identifier/ticks`, this.liquidityPoolTicks);
        this.router.get(`${this.basePath}/:identifier/swaps`, this.liquidityPoolSwaps);
        this.router.get(`${this.basePath}/:identifier/deposits`, this.liquidityPoolDeposits);
        this.router.get(`${this.basePath}/:identifier/withdraws`, this.liquidityPoolWithdraws);
    }

    private liquidityPools(request: express.Request, response: express.Response) {
        const {
            identifier,
            dex,
            tokenA,
            tokenB,
        } = request.body;
        const {
            page,
            limit,
        } = request.query;

        const take: number = Math.min(Number((limit ? +limit : undefined) || MAX_PER_PAGE), MAX_PER_PAGE);
        const skip: number = (Math.max(Number((page ? +page : undefined) || 1), 1) - 1) * take;

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
                Math.ceil(total / take),
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
                .where('pools.identifier = :identifier', {
                    identifier,
                })
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
        } = request.query;

        if (! identifier) {
            return response.send(super.failResponse("Must supply 'identifier'"));
        }
        if (! (Object.values(TickInterval) as string[]).includes(resolution as string)) {
            return response.send(super.failResponse(`Must supply 'resolution' as ${Object.values(TickInterval).join(',')}`));
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
                                    fromTime,
                                });
                            }

                            if (toTime && ! isNaN(parseInt(toTime as string))) {
                                query.andWhere('ticks.time < :toTime', {
                                    toTime,
                                });
                            }

                            return query;
                        }),
                    )
                    .orderBy('time', 'ASC')
                    .getMany();
            });
        };

        return dbApiService.transaction(fetchTicks)
            .then((ticks: LiquidityPoolTick[]) => {
                const resource: LiquidityPoolTickResource = new LiquidityPoolTickResource();

                response.send(resource.manyToJson(ticks));
            }).catch((e) => response.send(super.failResponse(e)));
    }

    private liquidityPoolSwaps(request: express.Request, response: express.Response) {
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

        const fetchOrders: any = (manager: EntityManager) => {
            return manager.findOneBy(LiquidityPool, {
                identifier,
            }).then((pool: LiquidityPool | null) => {
                if (! pool) {
                    return Promise.reject('Unable to find liquidity pool');
                }
                return manager.createQueryBuilder(LiquidityPoolSwap, 'swaps')
                    .leftJoinAndSelect('swaps.swapInToken', 'swapInToken')
                    .leftJoinAndSelect('swaps.swapOutToken', 'swapOutToken')
                    .leftJoinAndSelect('swaps.liquidityPool', 'liquidityPool')
                    .leftJoinAndSelect('liquidityPool.tokenA', 'tokenA')
                    .leftJoinAndSelect('liquidityPool.tokenB', 'tokenB')
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
                        poolId: pool.id,
                    })
                    .andWhere(
                        new Brackets((query) => {
                            if (sender) {
                                if ((sender as string).startsWith('addr')) {
                                    query.where('swaps.senderPubKeyHash = :hash', {
                                        hash: lucidUtils.paymentCredentialOf(sender as string).hash
                                    });
                                } else {
                                    query.where('swaps.senderPubKeyHash = :hash', {
                                        hash: sender
                                    });
                                }
                            }

                            if (type && type === 'buy') {
                                query.andWhere('swaps.swapInTokenId = liquidityPool.tokenAId')
                                    .orWhere('swaps.swapInToken IS NULL AND liquidityPool.tokenA IS NULL');
                            }
                            if (type && type === 'sell') {
                                query.andWhere('swaps.swapInTokenId != liquidityPool.tokenAId')
                                    .orWhere('swaps.swapInToken IS NOT NULL AND liquidityPool.tokenA IS NULL');
                            }

                            return query;
                        }),
                    )
                    .orderBy('swaps.id', 'DESC')
                    .take(take)
                    .skip(skip)
                    .getManyAndCount();
            });
        };

        return dbApiService.query(fetchOrders)
            .then(([swaps, total]) => {
                const resource: LiquidityPoolSwapResource = new LiquidityPoolSwapResource();

                response.send(super.formatPaginatedResponse(
                    Number(page ?? 1),
                    Number(limit ?? MAX_PER_PAGE),
                    Math.ceil(total / take),
                    resource.manyToJson(swaps)
                ));
            }).catch((e) => response.send(super.failResponse(e)));
    }

    private liquidityPoolDeposits(request: express.Request, response: express.Response) {
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

        const fetchOrders: any = (manager: EntityManager) => {
            return manager.findOneBy(LiquidityPool, {
                identifier,
            }).then((pool: LiquidityPool | null) => {
                if (! pool) {
                    return Promise.reject('Unable to find liquidity pool');
                }
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
                        poolId: pool.id,
                    })
                    .andWhere(
                        new Brackets((query) => {
                            if (sender) {
                                if ((sender as string).startsWith('addr')) {
                                    query.where('deposits.senderPubKeyHash = :hash', {
                                        hash: lucidUtils.paymentCredentialOf(sender as string).hash
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
            });
        };

        return dbApiService.query(fetchOrders)
            .then(([deposits, total]) => {
                const resource: LiquidityPoolDepositResource = new LiquidityPoolDepositResource();

                response.send(super.formatPaginatedResponse(
                    Number(page ?? 1),
                    Number(limit ?? MAX_PER_PAGE),
                    Math.ceil(total / take),
                    resource.manyToJson(deposits)
                ));
            }).catch((e) => response.send(super.failResponse(e)));
    }

    private liquidityPoolWithdraws(request: express.Request, response: express.Response) {
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

        const fetchOrders: any = (manager: EntityManager) => {
            return manager.findOneBy(LiquidityPool, {
                identifier,
            }).then((pool: LiquidityPool | null) => {
                if (! pool) {
                    return Promise.reject('Unable to find liquidity pool');
                }
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
                        poolId: pool.id,
                    })
                    .andWhere(
                        new Brackets((query) => {
                            if (sender) {
                                if ((sender as string).startsWith('addr')) {
                                    query.where('withdraws.senderPubKeyHash = :hash', {
                                        hash: lucidUtils.paymentCredentialOf(sender as string).hash
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
            });
        };

        return dbApiService.query(fetchOrders)
            .then(([withdraws, total]) => {
                const resource: LiquidityPoolWithdrawResource = new LiquidityPoolWithdrawResource();

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

    private newest(request: express.Request, response: express.Response) {
        const {
            page,
            limit,
        } = request.query;

        const take: number = Math.min(Number((limit ? +limit : undefined) || MAX_PER_PAGE), MAX_PER_PAGE);
        const skip: number = (Math.max(Number((page ? +page : undefined) || 1), 1) - 1) * take;

        return dbApiService.query((manager: EntityManager) => {
            return manager.createQueryBuilder(LiquidityPool, 'pools')
                .leftJoinAndSelect('pools.tokenA', 'tokenA')
                .leftJoinAndSelect('pools.tokenB', 'tokenB')
                .orderBy('createdSlot', 'DESC')
                .limit(take)
                .offset(skip)
                .getManyAndCount();
        }).then(([liquidityPools, total]) => {
            const resource: LiquidityPoolResource = new LiquidityPoolResource();

            response.send(super.formatPaginatedResponse(
                Number(page ?? 1),
                Number(limit ?? MAX_PER_PAGE),
                Math.ceil(total / take),
                resource.manyToJson(liquidityPools)
            ));
        }).catch(() => response.send(super.failResponse('Unable to retrieve newest liquidity pools')));
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
                    const tokenADecimals: number = entry.tokenA ? entry.tokenA.decimals : 6;
                    const tokenBDecimals: number = entry.tokenB.decimals ?? 0;

                    const price: number = (entry.latestState.reserveA / 10**tokenADecimals) / (entry.latestState.reserveB / 10**tokenBDecimals);

                    prices.push({
                        identifier: entry.identifier,
                        price: price,
                        dayLow: entry.day_tick ? Math.min(entry.day_tick.low, price) : price,
                        dayHigh: entry.day_tick ? Math.max(entry.day_tick.high, price) : price,
                        dayChange: ! entry.day_tick ? 0 : (price - entry.day_tick.close) / entry.day_tick.close * 100,
                        hourChange: ! entry.hour_tick ? 0 : (price - entry.hour_tick.close) / entry.hour_tick.close * 100,
                    });

                    return prices;
                }, [])
            );
        }).catch(() => response.send(super.failResponse('Unable to retrieve liquidity pools')));
    }

}
