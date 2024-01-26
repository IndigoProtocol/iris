import { LiquidityPool } from '../../db/entities/LiquidityPool';
import { OrderRouteResults } from '../../types';
import { Token } from '../../db/entities/Asset';

export abstract class BaseRouter {

    abstract calculateRouting(pools: LiquidityPool[], swapAmount: bigint, swapInToken: Token, swapOutToken: Token, isReversed?: boolean): OrderRouteResults;

}
