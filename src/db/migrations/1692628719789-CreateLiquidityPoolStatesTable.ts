import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreatLiquidityPoolStatesTable1692628719789
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'liquidity_pool_states',
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
            name: 'tokenLpId',
            type: 'int',
          },
          {
            name: 'reserveA',
            type: 'varchar',
          },
          {
            name: 'reserveB',
            type: 'varchar',
          },
          {
            name: 'lpTokens',
            type: 'bigint',
            unsigned: true,
          },
          {
            name: 'tvl',
            type: 'bigint',
            isNullable: true,
            unsigned: true,
          },
          {
            name: 'feePercent',
            type: 'float',
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
            name: 'extra',
            type: 'json',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKeys('liquidity_pool_states', [
      new TableForeignKey({
        columnNames: ['liquidityPoolId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'liquidity_pools',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['tokenLpId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'assets',
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.createIndices('liquidity_pool_states', [
      new TableIndex({
        columnNames: ['liquidityPoolId'],
      }),
      new TableIndex({
        columnNames: ['slot'],
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('liquidity_pool_states', true, true, true);
  }
}
