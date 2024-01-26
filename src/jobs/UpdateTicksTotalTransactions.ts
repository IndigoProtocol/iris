import { BaseJob } from './BaseJob';
import { lucidUtils } from '../utils';
import { EntityManager } from 'typeorm';
import { dbService } from '../indexerServices';
import { LiquidityPoolTick } from '../db/entities/LiquidityPoolTick';
import { TickInterval } from '../constants';
import { LiquidityPool } from '../db/entities/LiquidityPool';

export class UpdateTicksTotalTransactions extends BaseJob {

    private readonly _liquidityPool: LiquidityPool;
    private readonly _slot: number;

    constructor(liquidityPool: LiquidityPool, slot: number) {
        super();

        this._liquidityPool = liquidityPool;
        this._slot = slot;
    }

    public async handle(): Promise<any> {
        const slotDate: Date = new Date(lucidUtils.slotToUnixTime(this._slot));

        const startOfMinute: number = new Date(slotDate.getUTCFullYear(), slotDate.getUTCMonth(), slotDate.getUTCDate(), slotDate.getUTCHours(), slotDate.getUTCMinutes(), 0, 0).getTime() / 1000;
        const startOfHour: number = new Date(slotDate.getUTCFullYear(), slotDate.getUTCMonth(), slotDate.getUTCDate(), slotDate.getUTCHours(), 0, 0, 0).getTime() / 1000;
        const startOfDay: number = new Date(slotDate.getUTCFullYear(), slotDate.getUTCMonth(), slotDate.getUTCDate(), 0, 0, 0, 0).getTime() / 1000;

        await dbService.transaction((manager: EntityManager) => {
            return this.updateTotalTransactions(manager, startOfMinute, TickInterval.Minute);
        });
        await dbService.transaction((manager: EntityManager) => {
            return this.updateTotalTransactions(manager, startOfHour, TickInterval.Hour);
        });
        await dbService.transaction((manager: EntityManager) => {
            return this.updateTotalTransactions(manager, startOfDay, TickInterval.Day);
        });

        return Promise.resolve();
    }

    private async updateTotalTransactions(manager: EntityManager, startOfTick: number, resolution: TickInterval): Promise<any> {
        const existingTick: LiquidityPoolTick | undefined = await manager.findOne(LiquidityPoolTick, {
            relations: ['liquidityPool'],
            where: {
                resolution,
                time: startOfTick,
                liquidityPool: {
                    id: this._liquidityPool.id,
                },
            },
        }) ?? undefined;

        if (! existingTick) {
            return Promise.resolve();
        }

        existingTick.totalTransactions++;

        return manager.save(existingTick);
    }

}
