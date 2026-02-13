import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm'

export class CreatePredictionMarketHistoriesTable1770056005001 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'prediction_market_histories',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment'
                    },
                    {
                        name: 'predictionMarketId',
                        type: 'int',
                    },
                    {
                        name: 'uuid',
                        type: 'varchar',
                    },
                    {
                        name: 'slot',
                        type: 'bigint',
                        unsigned: true,
                    },
                    {
                        name: 'yesShares',
                        type: 'int',
                    },
                    {
                        name: 'noShares',
                        type: 'int',
                    },
                    {
                        name: 'yesPrice',
                        type: 'double',
                    },
                    {
                        name: 'noPrice',
                        type: 'double',
                    },
                ],
            }),
            true
        );

        await queryRunner.createForeignKeys('prediction_market_histories', [
            new TableForeignKey({
                columnNames: ['predictionMarketId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'prediction_markets',
                onDelete: 'CASCADE'
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('prediction_market_histories', true, true, true);
    }

}
