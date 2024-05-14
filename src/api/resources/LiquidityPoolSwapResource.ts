import { BaseEntityResource } from './BaseEntityResource';
import { AssetResource } from './AssetResource';
import { LiquidityPoolSwap } from '../../db/entities/LiquidityPoolSwap';
import { LiquidityPoolResource } from './LiquidityPoolResource';
import { OperationStatusResource } from './OperationStatusResource';
import { OperationStatus } from '../../db/entities/OperationStatus';
import { stringify } from '../../utils';

export class LiquidityPoolSwapResource extends BaseEntityResource {

    private _assetResource: AssetResource;
    private _poolResource: LiquidityPoolResource;
    private _operationResource: OperationStatusResource;

    constructor() {
        super();

        this._assetResource = new AssetResource();
        this._poolResource = new LiquidityPoolResource();
        this._operationResource = new OperationStatusResource();
    }

    toJson(entity: LiquidityPoolSwap): Object {
        const response: any = {
            swapInToken: entity.swapInToken ? this._assetResource.toJson(entity.swapInToken) : null,
            swapOutToken: entity.swapOutToken ? this._assetResource.toJson(entity.swapOutToken) : null,
            orderType: entity.type,
            swapInAmount: Number(entity.swapInAmount),
            minReceive: Number(entity.minReceive),
            actualReceive: entity.actualReceive ? Number(entity.actualReceive) : null,
            dexFeesPaid: Number(entity.dexFeesPaid),
            senderPubKeyHash: entity.senderPubKeyHash,
            senderStakeKeyHash: entity.senderStakeKeyHash,
            slot: Number(entity.slot),
            txHash: entity.txHash,
            outputIndex: Number(entity.outputIndex),
            meta: stringify(entity.meta),
        };

        if (entity.liquidityPool) {
            response.liquidityPool = this._poolResource.toJson(entity.liquidityPool);
        }

        if (entity.statuses?.length > 0) {
            response.statuses = entity.statuses.map((status: OperationStatus) => this._operationResource.toJson(status));
        }

        return response;
    }

    toCompressed(entity: LiquidityPoolSwap): Object {
        const response: any = {
            t: 'LiquidityPoolSwap',
            siT: entity.swapInToken ? this._assetResource.toCompressed(entity.swapInToken) : null,
            soT: entity.swapOutToken ? this._assetResource.toCompressed(entity.swapOutToken) : null,
            oT: entity.type,
            iA: Number(entity.swapInAmount),
            mR: Number(entity.minReceive),
            aR: entity.actualReceive ? Number(entity.actualReceive) : null,
            fP: Number(entity.dexFeesPaid),
            pkh: entity.senderPubKeyHash,
            skh: entity.senderStakeKeyHash,
            s: Number(entity.slot),
            tH: entity.txHash,
            oI: Number(entity.outputIndex),
            m: stringify(entity.meta),
        };

        if (entity.liquidityPool) {
            response.lp = this._poolResource.toCompressed(entity.liquidityPool);
        }

        if (entity.statuses?.length > 0) {
            response.st = entity.statuses.map((status: OperationStatus) => this._operationResource.toCompressed(status));
        }

        if (entity.transaction) {
            response.tr = stringify(entity.transaction);
        }

        return response;
    }

}
