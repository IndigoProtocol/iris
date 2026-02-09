import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class CreateLiqwidMarketsTable1770056005002 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'liqwid_markets',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment'
                    },
                    {
                        name: 'slot',
                        type: 'bigint',
                        unsigned: true,
                    },
                    {
                        name: 'asset',
                        type: 'varchar',
                    },
                    {
                        name: 'minSupply',
                        type: 'double',
                    },
                    {
                        name: 'minBatchTime',
                        type: 'double',
                    },
                    {
                        name: 'maxBatchTime',
                        type: 'double',
                    },
                    {
                        name: 'minBatchSize',
                        type: 'double',
                    },
                    {
                        name: 'interestUtilMultiplier',
                        type: 'double',
                    },
                    {
                        name: 'interestUtilMultiplierJump',
                        type: 'double',
                    },
                    {
                        name: 'borrowCap',
                        type: 'double',
                        isNullable: true,
                    },
                    {
                        name: 'supplyCap',
                        type: 'double',
                        isNullable: true,
                    },
                ],
            }),
            true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('liqwid_markets', true, true, true);
    }

}
