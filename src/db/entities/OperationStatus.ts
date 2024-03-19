import { BaseEntity, Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { DexOperationStatus } from '../../constants';

@Entity({ name: 'operation_statuses' })
@Index(['operationId', 'operationType', 'status'], { unique: true })
export class OperationStatus extends BaseEntity {

    operationEntity: any;
    operationTxHash: string;
    operationOutputIndex: number;

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    operationId: number;

    @Column({ type: 'varchar' })
    operationType: string;

    @Column()
    status: DexOperationStatus;

    @Column({ type: 'bigint', unsigned: true })
    slot: number;

    @Column()
    txHash: string;

    @Column()
    outputIndex: number;

    static make(
        status: DexOperationStatus,
        slot: number,
        txHash: string,
        outputIndex: number,
        operationTxHash: string,
        operationOutputIndex: number,
        operationId?: number,
        operationType?: string,
    ): OperationStatus {
        let instance: OperationStatus = new OperationStatus();

        instance.status = status;
        instance.slot = slot;
        instance.txHash = txHash;
        instance.outputIndex = outputIndex;
        instance.operationTxHash = operationTxHash;
        instance.operationOutputIndex = operationOutputIndex;

        if (operationId) {
            instance.operationId = operationId;
        }
        if (operationType) {
            instance.operationType = operationType;
        }

        return instance;
    }

}
