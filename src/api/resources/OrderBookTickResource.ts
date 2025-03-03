import { BaseEntityResource } from './BaseEntityResource';
import { OrderBookTick } from '../../db/entities/OrderBookTick';
import { OrderBookResource } from './OrderBookResource';

export class OrderBookTickResource extends BaseEntityResource {
  toJson(entity: OrderBookTick): Object {
    let response: any = {
      resolution: entity.resolution,
      open: entity.open,
      high: entity.high,
      low: entity.low,
      close: entity.close,
      volume: entity.volume,
      time: entity.time,
    };

    if (entity.orderBook) {
      response.orderBook = new OrderBookResource().toJson(entity.orderBook);
    }

    return response;
  }

  toCompressed(entity: OrderBookTick): Object {
    let response: any = {
      t: 'OrderBookTick',
      r: entity.resolution,
      o: entity.open,
      h: entity.high,
      l: entity.low,
      c: entity.close,
      v: entity.volume,
      ti: entity.time,
    };

    if (entity.orderBook) {
      response.oB = new OrderBookResource().toCompressed(entity.orderBook);
    }

    return response;
  }
}
