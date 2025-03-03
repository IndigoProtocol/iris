import { BaseEntityResource } from './BaseEntityResource';
import { OrderBookMatch } from '../../db/entities/OrderBookMatch';
import { AssetResource } from './AssetResource';
import { OrderBookResource } from './OrderBookResource';
import { OrderBookOrderResource } from './OrderBookOrderResource';
import { stringify } from '../../utils';

export class OrderBookMatchResource extends BaseEntityResource {
  private _assetResource: AssetResource;
  private _orderBookResource: OrderBookResource;
  private _orderBookOrderResource: OrderBookOrderResource;

  constructor() {
    super();

    this._assetResource = new AssetResource();
    this._orderBookResource = new OrderBookResource();
    this._orderBookOrderResource = new OrderBookOrderResource();
  }

  toJson(entity: OrderBookMatch): Object {
    let response: any = {
      referenceOrder: this._orderBookOrderResource.toJson(
        entity.referenceOrder
      ),
      fromToken: entity.matchedToken
        ? this._assetResource.toJson(entity.matchedToken)
        : null,
      matchedAmount: Number(entity.matchedAmount),
      receiverPubKeyHash: entity.receiverPubKeyHash,
      receiverStakeKeyHash: entity.receiverStakeKeyHash,
      slot: Number(entity.slot),
      txHash: entity.txHash,
      outputIndex: Number(entity.slot),
      meta: stringify(entity.meta),
    };

    if (entity.orderBook) {
      response.orderBook = this._orderBookResource.toJson(entity.orderBook);
    }

    return response;
  }

  toCompressed(entity: OrderBookMatch): Object {
    let response: any = {
      t: 'OrderBookMatch',
      rO: this._orderBookOrderResource.toCompressed(entity.referenceOrder),
      fT: entity.matchedToken
        ? this._assetResource.toCompressed(entity.matchedToken)
        : null,
      mA: Number(entity.matchedAmount),
      pkh: entity.receiverPubKeyHash,
      skh: entity.receiverStakeKeyHash,
      s: Number(entity.slot),
      tH: entity.txHash,
      oI: Number(entity.outputIndex),
      m: stringify(entity.meta),
    };

    if (entity.orderBook) {
      response.oB = this._orderBookResource.toCompressed(entity.orderBook);
    }

    if (entity.transaction) {
      response.tr = stringify(entity.transaction);
    }

    return response;
  }
}
