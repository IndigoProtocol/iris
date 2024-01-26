import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm"

export class CreatLiquidityPoolWithdrawsTable1692629978609 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'liquidity_pool_withdraws',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment'
                    },
                    {
                        name: 'liquidityPoolId',
                        type: 'int',
                    },
                    {
                        name: 'lpTokenId',
                        type: 'int',
                    },
                    {
                        name: 'lpTokenAmount',
                        type: 'bigint',
                        unsigned: true,
                    },
                    {
                        name: 'minReceiveA',
                        type: 'bigint',
                        isNullable: true,
                        unsigned: true,
                    },
                    {
                        name: 'minReceiveB',
                        type: 'bigint',
                        isNullable: true,
                        unsigned: true,
                    },
                    {
                        name: 'dexFeesPaid',
                        type: 'bigint',
                        unsigned: true,
                    },
                    {
                        name: 'senderPubKeyHash',
                        type: 'varchar',
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

        await queryRunner.createForeignKeys('liquidity_pool_withdraws', [
            new TableForeignKey({
                columnNames: ['liquidityPoolId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'liquidity_pools',
                onDelete: 'CASCADE'
            }),
            new TableForeignKey({
                columnNames: ['lpTokenId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'assets',
                onDelete: 'CASCADE'
            }),
        ]);

        await queryRunner.createIndices('liquidity_pool_withdraws', [
            new TableIndex({
                columnNames: ['txHash', 'outputIndex'],
            }),
            new TableIndex({
                columnNames: ['liquidityPoolId'],
            }),
            new TableIndex({
                columnNames: ['senderPubKeyHash'],
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('liquidity_pool_withdraws', true, true, true);
    }

}
