import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateOrderBooksTable1703352414322 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'order_books',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'identifier',
            type: 'varchar',
          },
          {
            name: 'dex',
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
            name: 'createdSlot',
            type: 'bigint',
            unsigned: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKeys('order_books', [
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

    await queryRunner.createIndices('order_books', [
      new TableIndex({
        columnNames: ['dex', 'tokenAId', 'tokenBId'],
      }),
      new TableIndex({
        columnNames: ['identifier'],
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('order_books', true, true, true);
  }
}
