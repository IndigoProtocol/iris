import { BaseJob } from './BaseJob';
import { LiquidityPoolState } from '../db/entities/LiquidityPoolState';
import { lucidUtils } from '../utils';
import { EntityManager } from 'typeorm';
import { dbService, eventService, operationWs } from '../indexerServices';
import { LiquidityPoolTick } from '../db/entities/LiquidityPoolTick';
import { TickInterval } from '../constants';
import { logInfo } from '../logger';

export class UpdateLiquidityPoolTicks extends BaseJob {

    private readonly _liquidityPoolState: LiquidityPoolState;

    constructor(liquidityPoolState: LiquidityPoolState) {
        super();

        this._liquidityPoolState = liquidityPoolState;
    }

    public async handle(): Promise<any> {
        logInfo(`[Queue] \t UpdateLiquidityPoolTicks for ${this._liquidityPoolState.txHash}`);

        const slotDate: Date = new Date(lucidUtils.slotToUnixTime(this._liquidityPoolState.slot));

        const startOfMinute: number = new Date(slotDate.getUTCFullYear(), slotDate.getUTCMonth(), slotDate.getUTCDate(), slotDate.getUTCHours(), slotDate.getUTCMinutes(), 0, 0).getTime() / 1000;
        const startOfHour: number = new Date(slotDate.getUTCFullYear(), slotDate.getUTCMonth(), slotDate.getUTCDate(), slotDate.getUTCHours(), 0, 0, 0).getTime() / 1000;
        const startOfDay: number = new Date(slotDate.getUTCFullYear(), slotDate.getUTCMonth(), slotDate.getUTCDate(), 0, 0, 0, 0).getTime() / 1000;

        return Promise.all([
            this.createOrUpdateTick(startOfMinute, TickInterval.Minute),
            this.createOrUpdateTick(startOfHour, TickInterval.Hour),
            this.createOrUpdateTick(startOfDay, TickInterval.Day)
        ]);
    }

    private async createOrUpdateTick(startOfTick: number, resolution: TickInterval): Promise<any> {
        if (! this._liquidityPoolState.liquidityPool) {
            return Promise.reject('Liquidity Pool not found for liquidity pool state');
        }

        const tokenADecimals: number = ! this._liquidityPoolState.liquidityPool.tokenA ? 6 : this._liquidityPoolState.liquidityPool.tokenA?.decimals ?? 0;
        const tokenBDecimals: number = this._liquidityPoolState.liquidityPool.tokenB.decimals;

        const price: number = this._liquidityPoolState.reserveB !== 0 ? (this._liquidityPoolState.reserveA / 10**tokenADecimals) / (this._liquidityPoolState.reserveB / 10**tokenBDecimals) : 0;
        const existingTick: LiquidityPoolTick | undefined = await dbService.query((manager: EntityManager) => {
            return manager.createQueryBuilder(LiquidityPoolTick, 'ticks')
                .leftJoinAndSelect('ticks.liquidityPool', 'liquidityPool')
                .leftJoinAndSelect('liquidityPool.tokenA', 'tokenA')
                .leftJoinAndSelect('liquidityPool.tokenB', 'tokenB')
                .where('resolution = :resolution', { resolution })
                .andWhere('ticks.liquidityPoolId = :liquidityPoolId', {
                    liquidityPoolId: this._liquidityPoolState?.liquidityPool?.id
                })
                .andWhere('ticks.time = :time', {
                    time: startOfTick
                })
                .orderBy('ticks.time', 'DESC')
                .limit(1)
                .getOne() ?? undefined;
        });

        if (! existingTick) {
            if (! this._liquidityPoolState.liquidityPool) {
                return Promise.reject('Liquidity Pool not found for liquidity pool state');
            }

            const lastTick: LiquidityPoolTick | undefined = await dbService.query((manager: EntityManager) => {
                return manager.createQueryBuilder(LiquidityPoolTick, 'ticks')
                    .where('resolution = :resolution', { resolution })
                    .andWhere('ticks.liquidityPoolId = :liquidityPoolId', {
                        liquidityPoolId: this._liquidityPoolState?.liquidityPool?.id
                    })
                    .orderBy('ticks.time', 'DESC')
                    .limit(1)
                    .getOne() ?? undefined;
            });

            const open: number = lastTick ? lastTick.close : price;

            return dbService.transaction((manager: EntityManager) => {
                return manager.save(
                    LiquidityPoolTick.make(
                        this._liquidityPoolState.liquidityPool,
                        resolution,
                        startOfTick,
                        open,
                        open > price ? open : price,
                        open < price ? open : price,
                        price,
                        this._liquidityPoolState.tvl,
                        Math.abs(lastTick ? this._liquidityPoolState.tvl - lastTick.tvl : this._liquidityPoolState.tvl)
                    )
                ).then((tick: LiquidityPoolTick) => {
                    operationWs.broadcast(tick);

                    eventService.pushEvent({
                        type: 'LiquidityPoolTickCreated',
                        data: tick,
                    });

                    return Promise.resolve();
                }).catch(() => this.createOrUpdateTick(startOfTick, resolution));
            });
        }

        if (price < existingTick.low) {
            existingTick.low = price;
        }

        if (price > existingTick.high) {
            existingTick.high = price;
        }

        existingTick.close = price;
        existingTick.volume += Math.abs(existingTick.tvl - this._liquidityPoolState.tvl) / 2;
        existingTick.tvl = this._liquidityPoolState.tvl;

        return dbService.transaction((manager: EntityManager) => {
            return manager.save(existingTick)
                .then((tick: LiquidityPoolTick) => {
                    operationWs.broadcast(tick);

                    eventService.pushEvent({
                        type: 'LiquidityPoolTickUpdated',
                        data: tick,
                    });

                    return Promise.resolve();
                });
        });
    }

}
