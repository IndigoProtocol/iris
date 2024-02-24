import { BaseEntityResource } from './BaseEntityResource';
import { AssetResource } from './AssetResource';
import { OrderBook } from '../../db/entities/OrderBook';

export class OrderBookResource extends BaseEntityResource {

    private _assetResource: AssetResource;

    constructor() {
        super();

        this._assetResource = new AssetResource();
    }

    toJson(entity: OrderBook): Object {
        return {
            dex: entity.dex,
            identifier: entity.identifier,
            tokenA: entity.tokenA ? this._assetResource.toJson(entity.tokenA) : null,
            tokenB: this._assetResource.toJson(entity.tokenB),
            createdSlot: entity.createdSlot,
        };
    }

    toCompressed(entity: OrderBook): Object {
        return {
            t: 'OrderBook',
            d: entity.dex,
            i: entity.identifier,
            tA: entity.tokenA ? this._assetResource.toCompressed(entity.tokenA) : null,
            tB: this._assetResource.toCompressed(entity.tokenB),
            cS: entity.createdSlot,
        };
    }

}
