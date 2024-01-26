import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm"
import { DexOperationStatus } from '../../constants';

export class CreateOperationStatusesTable1694101486899 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'operation_statuses',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment'
                    },
                    {
                        name: 'operationId',
                        type: 'int',
                    },
                    {
                        name: 'operationType',
                        type: 'varchar',
                    },
                    {
                        name: 'status',
                        type: 'int',
                        default: DexOperationStatus.Pending,
                    },
                    {
                        name: 'slot',
                        type: 'bigint',
                        unsigned: true,
                    },
                    {
                        name: 'txHash',
                        type: 'varchar(64)',
                    },
                    {
                        name: 'outputIndex',
                        type: 'int',
                    },
                ],
            }),
            true
        );

        await queryRunner.createIndices('operation_statuses', [
            new TableIndex({
                columnNames: ['operationId', 'operationType', 'status'],
                isUnique: true,
            }),
            new TableIndex({
                columnNames: ['operationId'],
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('operation_statuses', true, true, true);
    }

}
