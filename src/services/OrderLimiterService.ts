import { BaseService } from './BaseService';
import { LimiterResultBreakdown, LimiterResults } from '../types';
import { LiquidityPool } from '../db/entities/LiquidityPool';
import { Token } from '../db/entities/Asset';
import { Dexter, SwapFee, SwapRequest } from '@indigo-labs/dexter';
import { dbApiService } from '../apiServices';
import { Brackets, EntityManager } from 'typeorm';
import { swapRequestForPool, tokenDecimals, tokenId } from '../utils';
import { LiquidityPoolResource } from '../api/resources/LiquidityPoolResource';

export class OrderLimiterService extends BaseService {

    public boot(): Promise<any> {
        return Promise.resolve();
    }

    /**
     * Route order to pools.
     */
    public createLimitEntries(dex: string, swapInAmount: bigint, swapInToken: Token, swapOutToken: Token, stepSize: number, lowestPrice: number): Promise<LimiterResults> {
        const dexter: Dexter = new Dexter();

        if (! Object.keys(dexter.availableDexs).includes(dex)) {
            return Promise.reject('DEX not supported');
        }

        return this.loadLiquidityPool(dex, swapInToken, swapOutToken)
            .then((pool: LiquidityPool) => {
                if (swapInToken !== 'lovelace') {
                    swapInToken.decimals = tokenDecimals(swapInToken, pool);
                }
                if (swapOutToken !== 'lovelace') {
                    swapOutToken.decimals = tokenDecimals(swapOutToken, pool);
                }

                const savedReserveA: number = pool.latestState.reserveA;
                const savedReserveB: number = pool.latestState.reserveB;

                const swapInTokenDecimals: number = swapInToken === 'lovelace' ? 6 : swapInToken.decimals;
                const swapOutTokenDecimals: number = swapOutToken === 'lovelace' ? 6 : swapOutToken.decimals;

                const limitResults: LimiterResultBreakdown[] = [];
                const maxOrders: number = Math.floor(((pool.latestState.reserveA / pool.latestState.reserveB) - Math.max(lowestPrice, 0)) / stepSize);
                let percentages: number[] = [];

                for (let orderNum = 0; orderNum < maxOrders; orderNum++) {
                    const percent: number = Number((100 / maxOrders / 100).toFixed(3));
                    const total: number = percentages.reduce((totalPercent: number, percent: number) => totalPercent + percent, 0);

                    if (total + percent > 1) {
                        percentages.push(1 - total);
                    } else  {
                        percentages.push(100 / maxOrders / 100);
                    }
                }

                let currentStep: number = stepSize;

                percentages.forEach((percent: number) => {
                    const splitAmount: bigint = BigInt(
                        Math.round(Number(swapInAmount) * percent)
                    );

                    let swapInReserve: number;
                    let swapOutReserve: number;
                    let isOrderFlipped: boolean = false;

                    if (tokenId(swapInToken) === tokenId(pool.tokenA ?? 'lovelace' as Token)) {
                        swapInReserve = pool.latestState.reserveA;
                        swapOutReserve = pool.latestState.reserveB;
                    } else {
                        swapInReserve = pool.latestState.reserveB;
                        swapOutReserve = pool.latestState.reserveA;
                        isOrderFlipped = true;
                    }

                    const currentPrice: number = swapInReserve / swapOutReserve;
                    const wantedPrice: number = currentPrice - currentStep;

                    pool.latestState.reserveA = isOrderFlipped ? swapOutReserve : (swapOutReserve * wantedPrice);
                    pool.latestState.reserveB = isOrderFlipped ? (swapInReserve / wantedPrice) : swapOutReserve;

                    const swapRequest: SwapRequest = swapRequestForPool(pool, splitAmount, swapInToken);
                    const estReceive: bigint = swapRequest.getEstimatedReceive();

                    limitResults.push({
                        swapInAmount: Number(splitAmount) / 10**swapInTokenDecimals,
                        estimatedReceive: Number(estReceive) / 10**swapOutTokenDecimals,
                        percentAllocated: percent * 100,
                        dexFees: Number(swapRequest.getSwapFees().reduce((totalFees: bigint, fee: SwapFee) => totalFees + fee.value, 0n)) / 10**6,
                        price: wantedPrice,
                    });

                    currentStep += stepSize;
                    pool.latestState.reserveA = savedReserveA;
                    pool.latestState.reserveB = savedReserveB;
                });

                return {
                    totalSwapInAmount: Number(swapInAmount) / 10**swapInTokenDecimals,
                    totalEstimatedReceive: limitResults.reduce((total: number, result: LimiterResultBreakdown) => {
                        return Number((total + result.estimatedReceive).toFixed(swapOutTokenDecimals));
                    }, 0),
                    liquidityPool: (new LiquidityPoolResource()).toJson(pool),
                    results: limitResults,
                };
            });
    }

    private loadLiquidityPool(dex: string, swapInToken: Token, swapOutToken: Token): Promise<LiquidityPool> {
        return dbApiService.query((manager: EntityManager) => {
            return manager.createQueryBuilder(LiquidityPool, 'pools')
                .leftJoinAndSelect('pools.tokenA', 'tokenA')
                .leftJoinAndSelect('pools.tokenB', 'tokenB')
                .leftJoinAndSelect('pools.latestState', 'latestState')
                .where('pools.dex = :dex', { dex })
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
                .getOne();
        })
    }

}
