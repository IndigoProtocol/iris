import { BaseApiController } from './BaseApiController';
import express from 'express';
import { dbApiService } from '../../apiServices';
import { Brackets, EntityManager, SelectQueryBuilder } from 'typeorm';
import { Asset } from '../../db/entities/Asset';
import { AssetResource } from '../resources/AssetResource';
import { LiquidityPoolState } from '../../db/entities/LiquidityPoolState';
import { LiquidityPoolResource } from '../resources/LiquidityPoolResource';
import { LiquidityPool } from '../../db/entities/LiquidityPool';
import { TickInterval } from '../../constants';
import { LiquidityPoolTick } from '../../db/entities/LiquidityPoolTick';
import { LiquidityPoolTickResource } from '../resources/LiquidityPoolTickResource';

const MAX_PER_PAGE: number = 100;

export class AssetController extends BaseApiController {

    bootRoutes(): void {
        this.router.get(`${this.basePath}`, this.assets);
        this.router.post(`${this.basePath}`, this.assets);
        this.router.get(`${this.basePath}/search`, this.search);
        this.router.post(`${this.basePath}/ticks`, this.ticks);
        this.router.get(`${this.basePath}/:lpToken/pool`, this.lpTokenPool);
        this.router.get(`${this.basePath}/:asset`, this.asset);
        this.router.get(`${this.basePath}/:asset/price`, this.assetPrice);
    }

    private assets(request: express.Request, response: express.Response) {
        const {
            policyId,
            nameHex,
            isVerified,
        } = request.body;
        const {
            page,
            limit,
        } = request.query;

        const take: number = Math.min(Number((limit ? +limit : undefined) || MAX_PER_PAGE), MAX_PER_PAGE);
        const skip: number = (Math.max(Number((page ? +page : undefined) || 1), 1) - 1) * take;

        dbApiService.query((manager: EntityManager) => {
            return manager.findAndCount(Asset, {
                where: {
                    isLpToken: false,
                    isVerified: isVerified ? Boolean(isVerified) : undefined,
                    policyId: policyId ? policyId as string : undefined,
                    nameHex: nameHex ? nameHex as string : undefined,
                },
                take: take,
                skip: skip,
            });
        }).then(([assets, total]) => {
            const resource: AssetResource = new AssetResource();

            response.send(super.formatPaginatedResponse(
                Number(page ?? 1),
                Number(limit ?? MAX_PER_PAGE),
                Math.ceil(total / take),
                resource.manyToJson(assets)
            ));
        }).catch(() => response.send(super.failResponse('Unable to retrieve assets')));
    }

    private search(request: express.Request, response: express.Response) {
        const {
            query,
            onlyVerified,
            page,
            limit,
        } = request.query;

        const take: number = Math.min(Number((limit ? +limit : undefined) || MAX_PER_PAGE), MAX_PER_PAGE);
        const skip: number = (Math.max(Number((page ? +page : undefined) || 1), 1) - 1) * take;

        const searchQuery: string = '%' + (query as string)
            .replace(/[^a-z0-9\s]/gi, '')
            .toLowerCase() + '%';

        dbApiService.query((manager: EntityManager) => {
            return manager.createQueryBuilder(Asset, 'asset')
                .where('asset.isLpToken = false')
                .andWhere(
                    new Brackets((query) => {
                        if (onlyVerified) {
                            query.where("asset.isVerified = true");
                        }

                        query.where("LOWER(asset.name) LIKE :query", {
                            query: searchQuery,
                        }).orWhere("asset.nameHex LIKE :query", {
                            query: searchQuery,
                        }).orWhere("asset.policyId LIKE :query", {
                            query: searchQuery,
                        }).orWhere("LOWER(asset.ticker) LIKE :query", {
                            query: searchQuery,
                        }).orWhere("CAST(unhex(asset.nameHex) AS CHAR(100)) LIKE :query", {
                            query: searchQuery,
                        });
                    }),
                )
                .limit(take)
                .offset(skip)
                .getManyAndCount();
        }).then(([assets, total]) => {
            const resource: AssetResource = new AssetResource();

            response.send(super.formatPaginatedResponse(
                Number(page ?? 1),
                Number(limit ?? MAX_PER_PAGE),
                Math.ceil(total / take),
                resource.manyToJson(assets)
            ));
        }).catch(() => response.send(super.failResponse('Unable to search assets')));
    }

    private lpTokenPool(request: express.Request, response: express.Response) {
        const {
            lpToken,
        } = request.params;

        if (! lpToken) {
            return response.send(super.failResponse("Must supply 'lpToken'"));
        }

        const [tokenPolicyId, tokenNameHex] = (lpToken as string).split('.');

        return dbApiService.query((manager: EntityManager) => {
            return manager.findOne(LiquidityPoolState, {
                relations: [
                    'tokenLp',
                    'liquidityPool',
                    'liquidityPool.tokenA',
                    'liquidityPool.tokenB',
                    'liquidityPool.latestState',
                ],
                where: {
                    tokenLp: {
                        policyId: tokenPolicyId,
                        nameHex: tokenNameHex,
                    },
                },
            }).then((state: LiquidityPoolState | null) => {
                if (! state || ! state.liquidityPool) {
                    return response.send(super.failResponse('Token not assigned to a pool'));
                }

                const resource: LiquidityPoolResource = new LiquidityPoolResource();

                return response.send(resource.toJson(state.liquidityPool));
            });
        }).catch(() => response.send(super.failResponse('Token not assigned to a pool')));
    }

    private asset(request: express.Request, response: express.Response) {
        const {
            asset,
        } = request.params;

        if (! asset) {
            return response.send(super.failResponse("Must supply 'token'"));
        }

        const [tokenPolicyId, tokenNameHex] = (asset as string).split('.');

        return dbApiService.query((manager: EntityManager) => {
            return manager.findOne(Asset, {
                where: {
                    policyId: tokenPolicyId,
                    nameHex: tokenNameHex,
                },
            }).then((asset: Asset | null) => {
                if (! asset) {
                    return response.send(super.failResponse('Asset not found'));
                }

                const resource: AssetResource = new AssetResource();

                return response.send(resource.toJson(asset));
            });
        }).catch(() => response.send(super.failResponse('Asset not found')));
    }

    private assetPrice(request: express.Request, response: express.Response) {
        const {
            asset,
        } = request.params;

        if (! asset) {
            return response.send(super.failResponse("Must supply 'asset'"));
        }

        const [tokenPolicyId, tokenNameHex] = (asset as string).split('.');

        return dbApiService.query((manager: EntityManager) => {
            return manager.createQueryBuilder(LiquidityPool, 'pools')
                .leftJoinAndSelect('pools.tokenA', 'tokenA')
                .leftJoinAndSelect('pools.tokenB', 'tokenB')
                .leftJoinAndSelect('pools.latestState', 'latestState')
                .where('pools.tokenA IS NULL')
                .andWhere('tokenB.policyId = :policyId AND tokenB.nameHex = :nameHex', {
                    policyId: tokenPolicyId,
                    nameHex: tokenNameHex,
                })
                .andWhere('latestState.tvl >= :minTvl', { minTvl: 100_000_000000 })
                .getMany();
        }).then((liquidityPools: LiquidityPool[]) => {
            if (liquidityPools.length === 0) {
                return response.send({ price: 0 });
            }

            const avgPrice: number = liquidityPools.reduce((avgPrice: number, pool: LiquidityPool) => {
                const tokenADecimals: number = 6;
                const tokenBDecimals: number = pool.tokenB.decimals ?? 0;
                const price: number = (pool.latestState.reserveA / 10**tokenADecimals) / (pool.latestState.reserveB / 10**tokenBDecimals);

                return avgPrice + price;
            }, 0) / liquidityPools.length;

            return response.send({ price: avgPrice });
        }).catch(() => response.send(super.failResponse('Unable to retrieve asset price')));
    }

    private ticks(request: express.Request, response: express.Response) {
        const {
            forAssets,
        } = request.body;
        const {
            resolution,
            fromTime,
            toTime,
            orderBy,
        } = request.query;

        if (forAssets && ! (forAssets instanceof Array)) {
            return response.send(super.failResponse('Assets must be an array'));
        }
        if (! (Object.values(TickInterval) as string[]).includes(resolution as string)) {
            return response.send(super.failResponse(`Must supply 'resolution' as ${Object.values(TickInterval).join(',')}`));
        }
        if (orderBy && ! ['ASC', 'DESC'].includes(orderBy as string)) {
            return response.send(super.failResponse("orderBy must be 'ASC' or 'DESC'"));
        }

        const assets: Asset[] = ((forAssets ?? []) as string[]).map((identifier: string) => Asset.fromId(identifier));
        const policyIds: string[] = assets.map((asset: Asset) => asset.policyId);
        const nameHexs: string[] = assets.map((asset: Asset) => asset.nameHex);

        const fetchTicks: any = (manager: EntityManager) => {
            return manager.createQueryBuilder(LiquidityPoolTick, 'ticks')
                .leftJoinAndSelect('ticks.liquidityPool', 'liquidityPool')
                .leftJoinAndMapOne(
                    'liquidityPool.latestState',
                    LiquidityPoolState,
                    'states',
                    'states.liquidityPoolId = liquidityPool.id AND states.id = (SELECT MAX(id) FROM liquidity_pool_states WHERE liquidity_pool_states.slot + 1596491091 - 4924800 <= ticks.time AND liquidity_pool_states.liquidityPoolId = liquidityPool.id)'
                )
                .leftJoinAndSelect('liquidityPool.tokenB', 'tokenB')
                .andWhere('liquidityPool.tokenA IS NULL')
                .andWhere(
                    new Brackets((query) => {
                        query.andWhere('tokenB.policyId IN(:policyIds) AND tokenB.nameHex IN(:nameHexs)', {
                            policyIds,
                            nameHexs,
                        });

                        if (fromTime && ! isNaN(parseInt(fromTime as string))) {
                            query.andWhere('ticks.time >= :fromTime', {
                                fromTime: parseInt(fromTime as string),
                            });
                        }

                        if (toTime && ! isNaN(parseInt(toTime as string))) {
                            query.andWhere('ticks.time < :toTime', {
                                toTime: parseInt(toTime as string),
                            });
                        }

                        return query;
                    }),
                )
                .orderBy('time', orderBy ? (orderBy as 'ASC' | 'DESC') : 'ASC')
                .getMany();
        };

        return dbApiService.transaction(fetchTicks)
            .then((ticks: LiquidityPoolTick[]) => {
                const resource: LiquidityPoolTickResource = new LiquidityPoolTickResource();

                response.send(resource.manyToJson(ticks));
            }).catch((e) => response.send(super.failResponse(e)));
    }

}
