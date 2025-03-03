import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateLiquidityPoolTicks1696953524778
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'liquidity_pool_ticks',
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
            name: 'resolution',
            type: 'varchar',
          },
          {
            name: 'time',
            type: 'int',
          },
          {
            name: 'open',
            type: 'double',
          },
          {
            name: 'high',
            type: 'double',
          },
          {
            name: 'low',
            type: 'double',
          },
          {
            name: 'close',
            type: 'double',
          },
          {
            name: 'volume',
            type: 'double',
          },
          {
            name: 'tvl',
            type: 'bigint',
            isNullable: true,
            unsigned: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKeys('liquidity_pool_ticks', [
      new TableForeignKey({
        columnNames: ['liquidityPoolId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'liquidity_pools',
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.createIndices('liquidity_pool_ticks', [
      new TableIndex({
        columnNames: ['liquidityPoolId'],
      }),
      new TableIndex({
        columnNames: ['liquidityPoolId', 'resolution'],
      }),
      new TableIndex({
        columnNames: ['liquidityPoolId', 'resolution', 'time'],
        isUnique: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('liquidity_pool_ticks', true, true, true);
  }
}
