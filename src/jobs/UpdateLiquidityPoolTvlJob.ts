import { BaseJob } from './BaseJob';
import { LiquidityPoolState } from '../db/entities/LiquidityPoolState';
import { dbService, queue } from '../indexerServices';
import { Brackets, EntityManager } from 'typeorm';
import { LiquidityPool } from '../db/entities/LiquidityPool';
import { logInfo } from '../logger';
import { Asset } from '../db/entities/Asset';
import { UpdateLiquidityPoolTicks } from './UpdateLiquidityPoolTicks';

export class UpdateLiquidityPoolTvlJob extends BaseJob {

    private readonly _liquidityPoolState: LiquidityPoolState;

    constructor(liquidityPoolState: LiquidityPoolState) {
        super();

        this._liquidityPoolState = liquidityPoolState;
    }

    public async handle(): Promise<any> {
        logInfo(`[Queue] \t UpdateLiquidityPoolTvlJob for state ${this._liquidityPoolState.txHash}`);

        if (! this._liquidityPoolState.liquidityPool) {
            return Promise.reject('Liquidity Pool not found for liquidity pool state');
        }

        return (
            this._liquidityPoolState.liquidityPool.tokenA
                ? this.updateNonAdaPoolTvl()
                : this.updateAdaPoolTvl(this._liquidityPoolState.liquidityPool)
        ).finally(() => {
            queue.dispatch(new UpdateLiquidityPoolTicks(this._liquidityPoolState));
        })
    }

    private updateAdaPoolTvl(liquidityPool: LiquidityPool): Promise<any> {
        const tokenADecimals: number = 6;
        const tokenBDecimals: number = liquidityPool.tokenB.decimals ?? 0;

        const price: number = this._liquidityPoolState.reserveB !== 0 ? (this._liquidityPoolState.reserveA / 10**tokenADecimals) / (this._liquidityPoolState.reserveB / 10**tokenBDecimals) : 0;
        const reserveAValue: number = Number(this._liquidityPoolState.reserveA) / 10**tokenADecimals;
        const reserveBValue: number = (Number(this._liquidityPoolState.reserveB) / 10**tokenBDecimals) * price;

        this._liquidityPoolState.tvl = Math.floor((reserveAValue + reserveBValue) * 10**6);

        return dbService.transaction((manager: EntityManager) => {
            return manager.save(this._liquidityPoolState);
        });
    }

    private async updateNonAdaPoolTvl(): Promise<any> {
        this._liquidityPoolState.tvl = 2 * this._liquidityPoolState.reserveA;

        return dbService.transaction((manager: EntityManager) => {
            return manager.save(this._liquidityPoolState);
        });
    }

}
