import { BaseJob } from './BaseJob';
import { lucidUtils } from '../utils';
import { EntityManager } from 'typeorm';
import { dbService, eventService, operationWs, queue } from '../indexerServices';
import { IndexerEventType, TickInterval } from '../constants';
import { logInfo } from '../logger';
import { OrderBookMatch } from '../db/entities/OrderBookMatch';
import { OrderBookTick } from '../db/entities/OrderBookTick';

export class UpdateOrderBookTicks extends BaseJob {

    private readonly _match: OrderBookMatch;

    constructor(match: OrderBookMatch) {
        super();

        this._match = match;
    }

    public async handle(): Promise<any> {
        logInfo(`[Queue] UpdateOrderBookTicks for ${this._match.txHash}`);

        const slotDate: Date = new Date(lucidUtils.slotToUnixTime(this._match.slot));

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
        if (! this._match.orderBook) {
            return Promise.reject('Order Book not found for match');
        }
        if (! this._match.referenceOrder) {
            return Promise.reject('Order reference not found for match');
        }

        const price: number = this._match.referenceOrder.price;
        const existingTick: OrderBookTick | undefined = await manager.findOne(OrderBookTick, {
            relations: ['orderBook'],
            where: {
                resolution,
                time: startOfTick,
                orderBook: {
                    id: this._match.orderBook.id,
                },
            },
        }) ?? undefined;

        if (! existingTick) {
            const lastTick: OrderBookTick | undefined = await manager.findOne(OrderBookTick, {
                relations: ['orderBook'],
                where: {
                    resolution,
                    orderBook: {
                        id: this._match.orderBook.id,
                    },
                },
                order: {
                    time: 'DESC',
                }
            }) ?? undefined;

            const open: number = lastTick ? lastTick.close : price;

            return manager.save(
                OrderBookTick.make(
                    this._match.orderBook,
                    resolution,
                    startOfTick,
                    open,
                    open > price ? open : price,
                    open < price ? open : price,
                    price,
                    0,
                   0
                )
            );
        }

        if (price < existingTick.low) {
            existingTick.low = price;
        }

        if (price > existingTick.high) {
            existingTick.high = price;
        }

        existingTick.close = price;

        return manager.save(existingTick)
            .then((tick: OrderBookTick) => {
                operationWs.broadcast(tick);
                eventService.pushEvent({
                    type: IndexerEventType.LiquidityPoolTick,
                    data: tick,
                });

                return Promise.resolve();
            });
    }

}
