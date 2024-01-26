import { BaseEntityResource } from './BaseEntityResource';
import { OperationStatus } from '../../db/entities/OperationStatus';

export class OperationStatusResource extends BaseEntityResource {

    toJson(entity: OperationStatus): Object {
        return {
            status: entity.status,
            slot: Number(entity.slot),
            txHash: entity.txHash,
            outputIndex: Number(entity.outputIndex),
        };
    }

    toCompressed(entity: OperationStatus): Object {
        return {
            t: 'OperationStatus',
            st: entity.status,
            s: Number(entity.slot),
            tH: entity.txHash,
            oI: Number(entity.outputIndex),
        };
    }

}
