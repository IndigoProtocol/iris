import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreatLiquidityPoolZapsTable1692634752527
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'liquidity_pool_zaps',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
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
            name: 'forTokenId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'swapInAmount',
            type: 'bigint',
            unsigned: true,
          },
          {
            name: 'minLpTokenReceive',
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

    await queryRunner.createForeignKeys('liquidity_pool_zaps', [
      new TableForeignKey({
        columnNames: ['liquidityPoolId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'liquidity_pools',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['swapInTokenId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'assets',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['forTokenId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'assets',
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.createIndices('liquidity_pool_zaps', [
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
    await queryRunner.dropTable('liquidity_pool_zaps', true, true, true);
  }
}
