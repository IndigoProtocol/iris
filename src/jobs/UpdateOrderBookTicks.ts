import { BaseJob } from './BaseJob';
import { tokensMatch } from '../utils';
import { slotToUnixTime } from '@lucid-evolution/lucid'
import { EntityManager } from 'typeorm';
import { dbService, eventService, operationWs, queue } from '../indexerServices';
import { TickInterval } from '../constants';
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
        logInfo(`[Queue] \t UpdateOrderBookTicks for ${this._match.txHash}`);

        const slotDate: Date = new Date(slotToUnixTime("Mainnet", this._match.slot));

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
        if (! this._match.orderBook) {
            return Promise.reject('Order Book not found for match');
        }
        if (! this._match.referenceOrder) {
            return Promise.reject('Order reference not found for match');
        }

        const price: number = tokensMatch(this._match.orderBook.tokenA ?? 'lovelace', this._match.matchedToken ?? 'lovelace')
            ? 1 / this._match.referenceOrder.price
            : this._match.referenceOrder.price;

        const existingTick: OrderBookTick | undefined = await dbService.query((manager: EntityManager) => {
            return manager.createQueryBuilder(OrderBookTick, 'ticks')
                .where('resolution = :resolution', { resolution })
                .andWhere('ticks.orderBookId = :orderBookId', {
                    orderBookId: this._match.orderBook?.id
                })
                .andWhere('ticks.time = :time', {
                    time: startOfTick
                })
                .orderBy('ticks.time', 'DESC')
                .limit(1)
                .getOne() ?? undefined;
        });

        if (! existingTick) {
            const lastTick: OrderBookTick | undefined = await dbService.query((manager: EntityManager) => {
                return manager.createQueryBuilder(OrderBookTick, 'ticks')
                    .where('resolution = :resolution', { resolution })
                    .andWhere('ticks.orderBookId = :orderBookId', {
                        orderBookId: this._match.orderBook?.id
                    })
                    .orderBy('ticks.time', 'DESC')
                    .limit(1)
                    .getOne() ?? undefined;
            });

            const open: number = lastTick ? lastTick.close : price;

            return dbService.transaction((manager: EntityManager) => {
                if (! this._match.orderBook) {
                    return Promise.resolve();
                }

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
                ).then((tick: OrderBookTick) => {
                    operationWs.broadcast(tick);

                    eventService.pushEvent({
                        type: 'OrderBookTickCreated',
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

        return dbService.transaction((manager: EntityManager) => {
            return manager.save(existingTick)
                .then((tick: OrderBookTick) => {
                    operationWs.broadcast(tick);

                    eventService.pushEvent({
                        type: 'OrderBookTickUpdated',
                        data: tick,
                    });

                    return Promise.resolve();
                });
        });
    }

}
