import { BaseRouter } from './BaseRouter';
import { LiquidityPool } from '../../db/entities/LiquidityPool';
import { OrderRouteResult, OrderRouteResults } from '../../types';
import { Token } from '../../db/entities/Asset';
import { SwapFee, SwapRequest } from '@indigo-labs/dexter';
import { LiquidityPoolResource } from '../../api/resources/LiquidityPoolResource';
import { swapRequestForPool } from '../../utils';

export class DirectPoolRouter extends BaseRouter {

    calculateRouting(pools: LiquidityPool[], swapAmount: bigint, swapInToken: Token, swapOutToken: Token, isReversed: boolean = false): OrderRouteResults {
        const poolResults: OrderRouteResult = pools.reduce((results: OrderRouteResult, pool: LiquidityPool) => {
            const swapRequest: SwapRequest = swapRequestForPool(pool, swapAmount, swapInToken, isReversed);

            const estReceive: bigint = swapRequest.getEstimatedReceive();
            const priceImpact: number = swapRequest.getPriceImpactPercent();

            // Handle multiple pools on same DEX
            if (results[pool.dex] && results[pool.dex].priceImpactPercent < priceImpact) {
                return results;
            }

            results[pool.dex] = {
                swapInAmount: Number(swapRequest.swapInAmount) / 10**(swapInToken === 'lovelace' ? 6 : swapInToken.decimals),
                splitPercentage: 100,
                poolFeePercent: pool.latestState.feePercent,
                estimatedReceive: Number(estReceive) / 10**(swapOutToken === 'lovelace' ? 6 : swapOutToken.decimals),
                priceImpactPercent: priceImpact,
                dexFees: Number(swapRequest.getSwapFees().reduce((totalFees: bigint, fee: SwapFee) => totalFees + fee.value, 0n)) / 10**6,
                liquidityPool: (new LiquidityPoolResource()).toJson(pool),
            };

            return results;
        }, {});

        const bestDex: string = isReversed
            ? Object.keys(poolResults).reduce((prevDex: string, currentDex: string) => {
                return (poolResults[prevDex].priceImpactPercent > poolResults[currentDex].priceImpactPercent) ? currentDex : prevDex;
            })
            : Object.keys(poolResults).reduce((prevDex: string, currentDex: string) => {
                return (poolResults[prevDex].priceImpactPercent > poolResults[currentDex].priceImpactPercent) ? prevDex : currentDex;
            });

        return {
            totalSwapInAmount: poolResults[bestDex].swapInAmount,
            totalEstimatedReceive: poolResults[bestDex].estimatedReceive,
            results: {
                [bestDex]: poolResults[bestDex],
            },
        };
    }

}
