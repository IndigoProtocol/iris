import { BaseEntityResource } from './BaseEntityResource';
import { AssetResource } from './AssetResource';
import { LiquidityPoolResource } from './LiquidityPoolResource';
import { LiquidityPoolDeposit } from '../../db/entities/LiquidityPoolDeposit';
import { OperationStatus } from '../../db/entities/OperationStatus';
import { OperationStatusResource } from './OperationStatusResource';

export class LiquidityPoolDepositResource extends BaseEntityResource {

    private _assetResource: AssetResource;
    private _poolResource: LiquidityPoolResource;
    private _operationResource: OperationStatusResource;

    constructor() {
        super();

        this._assetResource = new AssetResource();
        this._poolResource = new LiquidityPoolResource();
        this._operationResource = new OperationStatusResource();
    }

    toJson(entity: LiquidityPoolDeposit): Object {
        const response: any = {
            depositAToken: entity.depositAToken ? this._assetResource.toJson(entity.depositAToken) : null,
            depositBToken: entity.depositBToken ? this._assetResource.toJson(entity.depositBToken) : null,
            depositAAmount: Number(entity.depositAAmount),
            depositBAmount: Number(entity.depositBAmount),
            dexFeesPaid: Number(entity.dexFeesPaid),
            senderPubKeyHash: entity.senderPubKeyHash,
            senderStakeKeyHash: entity.senderStakeKeyHash,
            slot: Number(entity.slot),
            txHash: entity.txHash,
            outputIndex: Number(entity.outputIndex),
        };

        if (entity.liquidityPool) {
            response.liquidityPool = this._poolResource.toJson(entity.liquidityPool);
        }

        if (entity.statuses?.length > 0) {
            response.statuses = entity.statuses.map((status: OperationStatus) => this._operationResource.toJson(status));
        }

        return response;
    }

    toCompressed(entity: LiquidityPoolDeposit): Object {
        const response: any = {
            t: 'LiquidityPoolDeposit',
            dAT: entity.depositAToken ? this._assetResource.toCompressed(entity.depositAToken) : null,
            dBT: entity.depositBToken ? this._assetResource.toCompressed(entity.depositBToken) : null,
            dAA: Number(entity.depositAAmount),
            dBA: Number(entity.depositBAmount),
            fP: Number(entity.dexFeesPaid),
            pkh: entity.senderPubKeyHash,
            skh: entity.senderStakeKeyHash,
            s: Number(entity.slot),
            tH: entity.txHash,
            oI: Number(entity.outputIndex),
        };

        if (entity.liquidityPool) {
            response.lp = this._poolResource.toCompressed(entity.liquidityPool);
        }

        if (entity.statuses?.length > 0) {
            response.st = entity.statuses.map((status: OperationStatus) => this._operationResource.toCompressed(status));
        }

        return response;
    }

}
