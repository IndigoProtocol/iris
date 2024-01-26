import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm"

export class CreatLiquidityPoolDepositsTable1692629574101 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'liquidity_pool_deposits',
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
                        name: 'depositATokenId',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'depositBTokenId',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'depositAAmount',
                        type: 'bigint',
                        unsigned: true,
                    },
                    {
                        name: 'depositBAmount',
                        type: 'bigint',
                        unsigned: true,
                    },
                    {
                        name: 'minLpTokenReceive',
                        type: 'bigint',
                        unsigned: true,
                        isNullable: true,
                    },
                    {
                        name: 'dexFeesPaid',
                        type: 'bigint',
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

        await queryRunner.createForeignKeys('liquidity_pool_deposits', [
            new TableForeignKey({
                columnNames: ['liquidityPoolId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'liquidity_pools',
                onDelete: 'CASCADE'
            }),
            new TableForeignKey({
                columnNames: ['depositATokenId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'assets',
                onDelete: 'CASCADE'
            }),
            new TableForeignKey({
                columnNames: ['depositBTokenId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'assets',
                onDelete: 'CASCADE'
            }),
        ]);

        await queryRunner.createIndices('liquidity_pool_deposits', [
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
        await queryRunner.dropTable('liquidity_pool_deposits', true, true, true);
    }

}
