import { BaseRouter } from './BaseRouter';
import { LiquidityPool } from '../../db/entities/LiquidityPool';
import { OrderRouteBreakdown, OrderRouteResult, OrderRouteResults } from '../../types';
import { Token } from '../../db/entities/Asset';
import { SwapFee, SwapRequest } from '@indigo-labs/dexter';
import { LiquidityPoolResource } from '../../api/resources/LiquidityPoolResource';
import { swapRequestForPool } from '../../utils';

export class TotalLiquiditySplitter extends BaseRouter {

    calculateRouting(pools: LiquidityPool[], swapAmount: bigint, swapInToken: Token, swapOutToken: Token, isReversed: boolean = false): OrderRouteResults {
        const totalLiquidity: number = pools.reduce((totalLiquidity: number, pool: LiquidityPool) => {
            return totalLiquidity + (pool.latestState.reserveA * pool.latestState.reserveB);
        }, 0);

        const splitResults: OrderRouteResult = pools.reduce((results: OrderRouteResult, pool: LiquidityPool) => {
            const splitPercent: number = Number(
                ((pool.latestState.reserveA * pool.latestState.reserveB) / totalLiquidity).toFixed(3)
            );

            if (splitPercent === 0) {
                return results;
            }

            const splitAmount: bigint = BigInt(
                Math.round(Number(swapAmount) * splitPercent)
            );

            const swapRequest: SwapRequest = swapRequestForPool(pool, splitAmount, swapInToken, isReversed);

            const estReceive: bigint = swapRequest.getEstimatedReceive();
            const priceImpact: number = swapRequest.getPriceImpactPercent();

            // Handle multiple pools on same DEX
            if (results[pool.dex] && results[pool.dex].priceImpactPercent < priceImpact) {
                return results;
            }

            results[pool.dex] = {
                swapInAmount: Number(swapRequest.swapInAmount) / 10**(swapInToken === 'lovelace' ? 6 : swapInToken.decimals),
                splitPercentage: splitPercent * 100,
                poolFeePercent: pool.latestState.feePercent,
                estimatedReceive: Number(estReceive) / 10**(swapOutToken === 'lovelace' ? 6 : swapOutToken.decimals),
                priceImpactPercent: priceImpact,
                dexFees: Number(swapRequest.getSwapFees().reduce((totalFees: bigint, fee: SwapFee) => totalFees + fee.value, 0n)) / 10**6,
                liquidityPool: (new LiquidityPoolResource()).toJson(pool),
            };

            return results;
        }, {});

        return {
            totalSwapInAmount: Object.values(splitResults).reduce((totalSwapInAmount: number, breakdown: OrderRouteBreakdown) => {
                return totalSwapInAmount + breakdown.swapInAmount;
            }, 0),
            totalEstimatedReceive: Object.values(splitResults).reduce((totalReceive: number, breakdown: OrderRouteBreakdown) => {
                return totalReceive + breakdown.estimatedReceive;
            }, 0),
            results: splitResults,
        };
    }

}
