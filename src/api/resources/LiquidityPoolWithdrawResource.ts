import { BaseEntityResource } from './BaseEntityResource';
import { AssetResource } from './AssetResource';
import { LiquidityPoolResource } from './LiquidityPoolResource';
import { LiquidityPoolWithdraw } from '../../db/entities/LiquidityPoolWithdraw';
import { OperationStatusResource } from './OperationStatusResource';
import { OperationStatus } from '../../db/entities/OperationStatus';
import { stringify } from '../../utils';

export class LiquidityPoolWithdrawResource extends BaseEntityResource {

    private _assetResource: AssetResource;
    private _poolResource: LiquidityPoolResource;
    private _operationResource: OperationStatusResource;

    constructor() {
        super();

        this._assetResource = new AssetResource();
        this._poolResource = new LiquidityPoolResource();
        this._operationResource = new OperationStatusResource();
    }

    toJson(entity: LiquidityPoolWithdraw): Object {
        const response: any = {
            lpToken: this._assetResource.toJson(entity.lpToken),
            lpTokenAmount: Number(entity.lpTokenAmount),
            minReceiveA: Number(entity.minReceiveA),
            minReceiveB: Number(entity.minReceiveB),
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

    toCompressed(entity: LiquidityPoolWithdraw): Object {
        const response: any = {
            t: 'LiquidityPoolWithdraw',
            lpT: this._assetResource.toCompressed(entity.lpToken),
            lpA: Number(entity.lpTokenAmount),
            mA: Number(entity.minReceiveA),
            mB: Number(entity.minReceiveB),
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
