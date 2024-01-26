import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm"
import { SwapOrderType } from '../../constants';

export class CreatLiquidityPoolSwapsTable1692634746860 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'liquidity_pool_swaps',
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
                        name: 'swapInTokenId',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'swapOutTokenId',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'type',
                        type: 'int',
                        default: SwapOrderType.Instant,
                    },
                    {
                        name: 'swapInAmount',
                        type: 'bigint',
                        unsigned: true,
                    },
                    {
                        name: 'minReceive',
                        type: 'bigint',
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

        await queryRunner.createForeignKeys('liquidity_pool_swaps', [
            new TableForeignKey({
                columnNames: ['liquidityPoolId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'liquidity_pools',
                onDelete: 'CASCADE'
            }),
            new TableForeignKey({
                columnNames: ['swapInTokenId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'assets',
                onDelete: 'CASCADE'
            }),
            new TableForeignKey({
                columnNames: ['swapOutTokenId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'assets',
                onDelete: 'CASCADE'
            }),
        ]);

        await queryRunner.createIndices('liquidity_pool_swaps', [
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
        await queryRunner.dropTable('liquidity_pool_swaps', true, true, true);
    }

}
