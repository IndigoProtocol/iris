import { BaseService } from './BaseService';
import { BaseRouter } from './order-routing/BaseRouter';
import { TotalLiquiditySplitter } from './order-routing/TotalLiquiditySplitter';
import { OrderRouteResults } from '../types';
import { LiquidityPool } from '../db/entities/LiquidityPool';
import { dbApiService } from '../apiServices';
import { Brackets, EntityManager } from 'typeorm';
import { Token } from '../db/entities/Asset';
import { Dexter } from '@indigo-labs/dexter';
import { tokenDecimals, tokensMatch } from '../utils';
import { DirectPoolRouter } from './order-routing/DirectPoolRouter';
import { EvenSplitter } from './order-routing/EvenSplitter';
import { ReserveSplitter } from './order-routing/ReserveSplitter';

export class OrderRouteService extends BaseService {

    private _routers: BaseRouter[] = [];

    constructor() {
        super();

        this._routers = [
            new DirectPoolRouter(),
            new TotalLiquiditySplitter(),
            new EvenSplitter(),
            new ReserveSplitter(),
        ];
    }

    public boot(): Promise<any> {
        return Promise.resolve();
    }

    /**
     * Route order to pools.
     */
    public route(dexs: string[], swapOutAmount: bigint, swapInToken: Token, swapOutToken: Token, isReversed: boolean = false): Promise<OrderRouteResults> {
        const dexter: Dexter = new Dexter();

        dexs = dexs.filter((dex: string) => Object.keys(dexter.availableDexs).includes(dex));

        return this.loadLiquidityPools(dexs, swapInToken, swapOutToken)
            .then((pools: LiquidityPool[]) => {
                return this._routers.map((router: BaseRouter) => {
                    if (swapInToken !== 'lovelace') {
                        swapInToken.decimals = tokenDecimals(swapInToken, pools[0]);
                    }
                    if (swapOutToken !== 'lovelace') {
                        swapOutToken.decimals = tokenDecimals(swapOutToken, pools[0]);
                    }

                    return router.calculateRouting(pools, swapOutAmount, swapInToken, swapOutToken, isReversed);
                }).reduce((prev: OrderRouteResults, current: OrderRouteResults) => {
                    return (prev.totalEstimatedReceive > current.totalEstimatedReceive) ? prev : current;
                });
            });
    }

    /**
     * Helper to retrieve related liquidity pools for a token pair.
     */
    private loadLiquidityPools(dexs: string[], swapInToken: Token, swapOutToken: Token): Promise<LiquidityPool[]> {
        return dbApiService.query((manager: EntityManager) => {
            return manager.createQueryBuilder(LiquidityPool, 'pools')
                .leftJoinAndSelect('pools.tokenA', 'tokenA')
                .leftJoinAndSelect('pools.tokenB', 'tokenB')
                .leftJoinAndSelect('pools.latestState', 'latestState')
                .where('pools.dex IN(:...dexs)', { dexs })
                .andWhere(
                    new Brackets((query) => {
                        if (swapInToken === 'lovelace' || swapOutToken === 'lovelace') {
                            query.andWhere('pools.tokenA IS NULL');
                        }

                        if (swapInToken === 'lovelace' && swapOutToken !== 'lovelace') {
                            query.andWhere('tokenB.policyId = :policyId', { policyId: swapOutToken.policyId })
                                .andWhere('tokenB.nameHex = :nameHex', { nameHex: swapOutToken.nameHex });
                        }

                        if (swapInToken !== 'lovelace' && swapOutToken === 'lovelace') {
                            query.andWhere('tokenB.policyId = :policyId', { policyId: swapInToken.policyId })
                                .andWhere('tokenB.nameHex = :nameHex', { nameHex: swapInToken.nameHex });
                        }

                        if (swapInToken !== 'lovelace' && swapOutToken !== 'lovelace') {
                            // Parameters must be unique across whole query
                            query.andWhere(new Brackets((query1) => {
                                query1.andWhere('tokenA.policyId = :policyIdOne', { policyIdOne: swapInToken.policyId })
                                    .andWhere('tokenA.nameHex = :nameHexOne', { nameHexOne: swapInToken.nameHex })
                                    .andWhere('tokenB.policyId = :policyIdTwo', { policyIdTwo: swapOutToken.policyId })
                                    .andWhere('tokenB.nameHex = :nameHexTwo', { nameHexTwo: swapOutToken.nameHex });
                            })).orWhere(new Brackets((query1) => {
                                query1.andWhere('tokenA.policyId = :policyIdThree', { policyIdThree: swapOutToken.policyId })
                                    .andWhere('tokenA.nameHex = :nameHexThree', { nameHexThree: swapOutToken.nameHex })
                                    .andWhere('tokenB.policyId = :policyIdFour', { policyIdFour: swapInToken.policyId })
                                    .andWhere('tokenB.nameHex = :nameHexFour', { nameHexFour: swapInToken.nameHex });
                            }));
                        }
                    })
                )
                .getMany();
        })
    }

}
