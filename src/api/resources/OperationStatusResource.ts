import { BaseEntityResource } from './BaseEntityResource';
import { OperationStatus } from '../../db/entities/OperationStatus';
import { LiquidityPoolSwap } from '../../db/entities/LiquidityPoolSwap';
import { LiquidityPoolSwapResource } from './LiquidityPoolSwapResource';
import { LiquidityPoolDeposit } from '../../db/entities/LiquidityPoolDeposit';
import { LiquidityPoolDepositResource } from './LiquidityPoolDepositResource';
import { LiquidityPoolWithdraw } from '../../db/entities/LiquidityPoolWithdraw';
import { LiquidityPoolWithdrawResource } from './LiquidityPoolWithdrawResource';

export class OperationStatusResource extends BaseEntityResource {

    toJson(entity: OperationStatus): Object {
        let response: any = {
            status: entity.status,
            slot: Number(entity.slot),
            txHash: entity.txHash,
            outputIndex: Number(entity.outputIndex),
            operationTxHash: entity.operationTxHash,
            operationOutputIndex: entity.operationOutputIndex,
        };

        if (entity.operationEntity) {
            switch (entity.operationEntity.constructor) {
                case LiquidityPoolSwap:
                    response.operationEntity = (new LiquidityPoolSwapResource()).toJson(entity.operationEntity as LiquidityPoolSwap); break;
                case LiquidityPoolDeposit:
                    response.operationEntity = (new LiquidityPoolDepositResource()).toJson(entity.operationEntity as LiquidityPoolDeposit); break;
                case LiquidityPoolWithdraw:
                    response.operationEntity = (new LiquidityPoolWithdrawResource()).toJson(entity.operationEntity as LiquidityPoolWithdraw); break;
                // todo include zaps
            }
        }

        return response;
    }

    toCompressed(entity: OperationStatus): Object {
        let response: any = {
            t: 'OperationStatus',
            st: entity.status,
            s: Number(entity.slot),
            tH: entity.txHash,
            oI: Number(entity.outputIndex),
            oTx: entity.operationTxHash,
            oOi: entity.operationOutputIndex,
        };

        if (entity.operationEntity) {
            switch (entity.operationEntity.constructor) {
                case LiquidityPoolSwap:
                    response.oE = (new LiquidityPoolSwapResource()).toCompressed(entity.operationEntity as LiquidityPoolSwap); break;
                case LiquidityPoolDeposit:
                    response.oE = (new LiquidityPoolDepositResource()).toCompressed(entity.operationEntity as LiquidityPoolDeposit); break;
                case LiquidityPoolWithdraw:
                    response.oE = (new LiquidityPoolWithdrawResource()).toCompressed(entity.operationEntity as LiquidityPoolWithdraw); break;
            }
        }

        return response;
    }

}
