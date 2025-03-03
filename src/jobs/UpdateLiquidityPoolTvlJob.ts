import { EntityManager } from 'typeorm';
import { Asset } from '../db/entities/Asset';
import { LiquidityPool } from '../db/entities/LiquidityPool';
import { LiquidityPoolState } from '../db/entities/LiquidityPoolState';
import { dbService, queue } from '../indexerServices';
import { logInfo } from '../logger';
import { BaseJob } from './BaseJob';
import { UpdateLiquidityPoolTicks } from './UpdateLiquidityPoolTicks';

export class UpdateLiquidityPoolTvlJob extends BaseJob {
  private readonly _liquidityPoolState: LiquidityPoolState;

  constructor(liquidityPoolState: LiquidityPoolState) {
    super();

    this._liquidityPoolState = liquidityPoolState;
  }

  public async handle(): Promise<any> {
    logInfo(
      `[Queue] \t UpdateLiquidityPoolTvlJob for state ${this._liquidityPoolState.txHash}`
    );

    if (!this._liquidityPoolState.liquidityPool) {
      return Promise.reject(
        'Liquidity Pool not found for liquidity pool state'
      );
    }

    return (
      this._liquidityPoolState.liquidityPool.tokenA
        ? this.updateNonAdaPoolTvl(this._liquidityPoolState.liquidityPool)
        : this.updateAdaPoolTvl(this._liquidityPoolState.liquidityPool)
    ).finally(() => {
      queue.dispatch(new UpdateLiquidityPoolTicks(this._liquidityPoolState));
    });
  }

  private updateAdaPoolTvl(liquidityPool: LiquidityPool): Promise<any> {
    const tokenADecimals: number = 6;
    const tokenBDecimals: number = liquidityPool.tokenB.decimals ?? 0;

    const price: number =
      +this._liquidityPoolState.reserveB !== 0
        ? +this._liquidityPoolState.reserveA /
          10 ** tokenADecimals /
          (+this._liquidityPoolState.reserveB / 10 ** tokenBDecimals)
        : 0;
    const reserveAValue: number =
      Number(this._liquidityPoolState.reserveA) / 10 ** tokenADecimals;
    const reserveBValue: number =
      (Number(this._liquidityPoolState.reserveB) / 10 ** tokenBDecimals) *
      price;

    this._liquidityPoolState.tvl = Math.floor(
      (reserveAValue + reserveBValue) * 10 ** 6
    );

    return dbService.transaction((manager: EntityManager) => {
      return manager.save(this._liquidityPoolState);
    });
  }

  private async updateNonAdaPoolTvl(
    liquidityPool: LiquidityPool
  ): Promise<any> {
    const retrieveLiquidityPool: any = (token: Asset) => {
      return dbService.query((manager: EntityManager) => {
        return manager
          .createQueryBuilder(LiquidityPool, 'pools')
          .leftJoinAndSelect('pools.tokenA', 'tokenA')
          .leftJoinAndSelect('pools.tokenB', 'tokenB')
          .leftJoinAndSelect('pools.latestState', 'latestState')
          .where('pools.tokenA IS NULL')
          .andWhere('pools.tokenB.id = :tokenBId', {
            tokenBId: token.id,
          })
          .orderBy('latestState.tvl', 'DESC')
          .limit(1)
          .getOne();
      });
    };

    const tokenAPool: LiquidityPool | null = await retrieveLiquidityPool(
      liquidityPool.tokenA
    );
    const tokenBPool: LiquidityPool | null = await retrieveLiquidityPool(
      liquidityPool.tokenB
    );

    if (
      !tokenAPool ||
      !tokenBPool ||
      !tokenAPool.latestState ||
      !tokenBPool.latestState
    ) {
      this._liquidityPoolState.tvl = 0;

      return dbService.transaction((manager: EntityManager) =>
        manager.save(this._liquidityPoolState)
      );
    }

    const tokenADecimals: number = liquidityPool.tokenA?.decimals ?? 0;
    const tokenBDecimals: number = liquidityPool.tokenB.decimals;

    const poolAPrice: number =
      +tokenAPool.latestState.reserveB !== 0
        ? +tokenAPool.latestState.reserveA /
          10 ** 6 /
          (+tokenAPool.latestState.reserveB / 10 ** tokenADecimals)
        : 0;
    const poolBPrice: number =
      +tokenBPool.latestState.reserveB !== 0
        ? +tokenBPool.latestState.reserveA /
          10 ** 6 /
          (+tokenBPool.latestState.reserveB / 10 ** tokenBDecimals)
        : 0;

    const reserveAValue: number =
      (Math.min(
        +this._liquidityPoolState.reserveA,
        +tokenAPool.latestState.reserveB
      ) /
        10 ** tokenADecimals) *
      poolAPrice;
    const reserveBValue: number =
      (Math.min(
        +this._liquidityPoolState.reserveB,
        +tokenBPool.latestState.reserveB
      ) /
        10 ** tokenBDecimals) *
      poolBPrice;

    this._liquidityPoolState.tvl = Math.floor(
      (reserveAValue + reserveBValue) * 10 ** 6
    );

    return dbService.transaction((manager: EntityManager) => {
      return manager.save(this._liquidityPoolState);
    });
  }
}
