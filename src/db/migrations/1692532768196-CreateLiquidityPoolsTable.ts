import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreatLiquidityPoolsTable1692532768196
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'liquidity_pools',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'dex',
            type: 'varchar',
          },
          {
            name: 'identifier',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'address',
            type: 'varchar',
          },
          {
            name: 'tokenAId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'tokenBId',
            type: 'int',
          },
          {
            name: 'latestStateId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'createdSlot',
            type: 'bigint',
            unsigned: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKeys('liquidity_pools', [
      new TableForeignKey({
        columnNames: ['tokenAId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'assets',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['tokenBId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'assets',
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.createIndices('liquidity_pools', [
      new TableIndex({
        columnNames: ['dex', 'tokenAId', 'tokenBId'],
      }),
      new TableIndex({
        columnNames: ['tokenAId'],
      }),
      new TableIndex({
        columnNames: ['tokenBId'],
      }),
      new TableIndex({
        columnNames: ['identifier'],
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('liquidity_pools', true, true, true);
  }
}
