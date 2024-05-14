import { BaseEntityResource } from './BaseEntityResource';
import { OrderBookOrder } from '../../db/entities/OrderBookOrder';
import { AssetResource } from './AssetResource';
import { OrderBookResource } from './OrderBookResource';
import { stringify } from '../../utils';

export class OrderBookOrderResource extends BaseEntityResource {

    private _assetResource: AssetResource;
    private _orderBookResource: OrderBookResource;

    constructor() {
        super();

        this._assetResource = new AssetResource();
        this._orderBookResource = new OrderBookResource();
    }

    toJson(entity: OrderBookOrder): Object {
        let response: any = {
            fromToken: entity.fromToken ? this._assetResource.toJson(entity.fromToken) : null,
            toToken: entity.toToken ? this._assetResource.toJson(entity.toToken) : null,
            identifier: entity.identifier,
            originalOfferAmount: Number(entity.originalOfferAmount),
            unFilledOfferAmount: Number(entity.unFilledOfferAmount),
            askedAmount: Number(entity.askedAmount),
            price: Number(entity.price),
            numPartialFills: Number(entity.numPartialFills),
            isCancelled: Number(entity.isCancelled),
            dexFeesPaid: Number(entity.dexFeesPaid),
            senderPubKeyHash: entity.senderPubKeyHash,
            senderStakeKeyHash: entity.senderStakeKeyHash,
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

    toCompressed(entity: OrderBookOrder): Object {
        let response: any = {
            t: 'OrderBookOrder',
            fT: entity.fromToken ? this._assetResource.toCompressed(entity.fromToken) : null,
            tT: entity.toToken ? this._assetResource.toCompressed(entity.toToken) : null,
            i: entity.identifier,
            oA: Number(entity.originalOfferAmount),
            uA: Number(entity.unFilledOfferAmount),
            aA: Number(entity.askedAmount),
            p: Number(entity.price),
            pF: Number(entity.numPartialFills),
            iC: Number(entity.isCancelled),
            fP: Number(entity.dexFeesPaid),
            pkh: entity.senderPubKeyHash,
            skh: entity.senderStakeKeyHash,
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
