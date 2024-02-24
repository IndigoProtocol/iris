import { BaseEntityResource } from './BaseEntityResource';
import { OrderBookTick } from '../../db/entities/OrderBookTick';

export class OrderBookTickResource extends BaseEntityResource {

    toJson(entity: OrderBookTick): Object {
        return {
            open: entity.open,
            high: entity.high,
            low: entity.low,
            close: entity.close,
            volume: entity.volume,
            time: entity.time,
        };
    }

    toCompressed(entity: OrderBookTick): Object {
        return {
            t: 'OrderBookTick',
            r: entity.resolution,
            o: entity.open,
            h: entity.high,
            l: entity.low,
            c: entity.close,
            v: entity.volume,
            ti: entity.time,
        };
    }

}
