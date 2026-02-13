import { MigrationInterface, QueryRunner, Table } from "typeorm"

export class CreatePredictionMarketsTable1770056005000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'prediction_markets',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment'
                    },
                    {
                        name: 'uuid',
                        type: 'varchar',
                    },
                    {
                        name: 'creatorPkh',
                        type: 'varchar',
                    },
                    {
                        name: 'creatorSkh',
                        type: 'varchar',
                    },
                    {
                        name: 'deadline',
                        type: 'bigint',
                    },
                    {
                        name: 'marketAssetPolicyId',
                        type: 'varchar',
                    },
                    {
                        name: 'marketAssetNameHex',
                        type: 'varchar',
                    },
                    {
                        name: 'positionPolicyId',
                        type: 'varchar',
                    },
                    {
                        name: 'positionYesNameHex',
                        type: 'varchar',
                    },
                    {
                        name: 'positionNoNameHex',
                        type: 'varchar',
                    },
                ],
            }),
            true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('prediction_markets', true, true, true);
    }

}
