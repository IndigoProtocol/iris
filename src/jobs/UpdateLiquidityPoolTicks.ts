import { BaseJob } from './BaseJob';
import { LiquidityPoolState } from '../db/entities/LiquidityPoolState';
import { lucidUtils } from '../utils';
import { EntityManager } from 'typeorm';
import { dbService, eventService, operationWs } from '../indexerServices';
import { LiquidityPoolTick } from '../db/entities/LiquidityPoolTick';
import { IndexerEventType, TickInterval } from '../constants';
import { logInfo } from '../logger';

export class UpdateLiquidityPoolTicks extends BaseJob {

    private readonly _liquidityPoolState: LiquidityPoolState;

    constructor(liquidityPoolState: LiquidityPoolState) {
        super();

        this._liquidityPoolState = liquidityPoolState;
    }

    public async handle(): Promise<any> {
        logInfo(`[Queue] UpdateLiquidityPoolTicks for ${this._liquidityPoolState.txHash}`);

        const slotDate: Date = new Date(lucidUtils.slotToUnixTime(this._liquidityPoolState.slot));

        const startOfMinute: number = new Date(slotDate.getUTCFullYear(), slotDate.getUTCMonth(), slotDate.getUTCDate(), slotDate.getUTCHours(), slotDate.getUTCMinutes(), 0, 0).getTime() / 1000;
        const startOfHour: number = new Date(slotDate.getUTCFullYear(), slotDate.getUTCMonth(), slotDate.getUTCDate(), slotDate.getUTCHours(), 0, 0, 0).getTime() / 1000;
        const startOfDay: number = new Date(slotDate.getUTCFullYear(), slotDate.getUTCMonth(), slotDate.getUTCDate(), 0, 0, 0, 0).getTime() / 1000;

        await dbService.transaction((manager: EntityManager) => {
            return this.createOrUpdateTick(manager, startOfMinute, TickInterval.Minute);
        });
        await dbService.transaction((manager: EntityManager) => {
            return this.createOrUpdateTick(manager, startOfHour, TickInterval.Hour);
        });
        await dbService.transaction((manager: EntityManager) => {
            return this.createOrUpdateTick(manager, startOfDay, TickInterval.Day);
        });

        return Promise.resolve();
    }

    private async createOrUpdateTick(manager: EntityManager, startOfTick: number, resolution: TickInterval): Promise<any> {
        if (! this._liquidityPoolState.liquidityPool) {
            return Promise.reject('Liquidity Pool not found for liquidity pool state');
        }

        const tokenADecimals: number = ! this._liquidityPoolState.liquidityPool.tokenA ? 6 : this._liquidityPoolState.liquidityPool.tokenA?.decimals ?? 0;
        const tokenBDecimals: number = this._liquidityPoolState.liquidityPool.tokenB.decimals;

        const price: number = this._liquidityPoolState.reserveB !== 0 ? (this._liquidityPoolState.reserveA / 10**tokenADecimals) / (this._liquidityPoolState.reserveB / 10**tokenBDecimals) : 0;
        const existingTick: LiquidityPoolTick | undefined = await manager.findOne(LiquidityPoolTick, {
            relations: ['liquidityPool'],
            where: {
                resolution,
                time: startOfTick,
                liquidityPool: {
                    id: this._liquidityPoolState?.liquidityPool?.id,
                },
            },
        }) ?? undefined;

        if (! existingTick) {
            if (! this._liquidityPoolState.liquidityPool) {
                return Promise.reject('Liquidity Pool not found for liquidity pool state');
            }

            const lastTick: LiquidityPoolTick | undefined = await manager.findOne(LiquidityPoolTick, {
                relations: ['liquidityPool'],
                where: {
                    resolution,
                    liquidityPool: {
                        id: this._liquidityPoolState?.liquidityPool?.id,
                    },
                },
                order: {
                    time: 'DESC',
                }
            }) ?? undefined;

            const open: number = lastTick ? lastTick.close : price;

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
                    type: IndexerEventType.LiquidityPoolTick,
                    data: tick,
                });

                return Promise.resolve();
            });
        }

        if (price < existingTick.low) {
            existingTick.low = price;
        }

        if (price > existingTick.high) {
            existingTick.high = price;
        }

        existingTick.close = price;
        existingTick.volume += Math.abs(existingTick.tvl - this._liquidityPoolState.tvl)
        existingTick.tvl = this._liquidityPoolState.tvl;

        return manager.save(existingTick)
            .then((tick: LiquidityPoolTick) => {
                operationWs.broadcast(tick);
                eventService.pushEvent({
                    type: IndexerEventType.LiquidityPoolTick,
                    data: tick,
                });

                return Promise.resolve();
            });
    }

}
