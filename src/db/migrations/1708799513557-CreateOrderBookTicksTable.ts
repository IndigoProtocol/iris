import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateOrderBookTicksTable1708799513557
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'order_book_ticks',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'orderBookId',
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

    await queryRunner.createForeignKeys('order_book_ticks', [
      new TableForeignKey({
        columnNames: ['orderBookId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'order_books',
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.createIndices('order_book_ticks', [
      new TableIndex({
        columnNames: ['orderBookId'],
      }),
      new TableIndex({
        columnNames: ['orderBookId', 'resolution'],
      }),
      new TableIndex({
        columnNames: ['orderBookId', 'resolution', 'time'],
        isUnique: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('order_book_ticks', true, true, true);
  }
}
