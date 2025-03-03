import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateOrderBookOrdersTable1703352431901
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'order_book_orders',
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
            name: 'fromTokenId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'toTokenId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'identifier',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'originalOfferAmount',
            type: 'bigint',
            unsigned: true,
          },
          {
            name: 'unFilledOfferAmount',
            type: 'bigint',
            unsigned: true,
          },
          {
            name: 'askedAmount',
            type: 'bigint',
            unsigned: true,
          },
          {
            name: 'price',
            type: 'float',
            unsigned: true,
          },
          {
            name: 'numPartialFills',
            type: 'int',
            unsigned: true,
          },
          {
            name: 'isCancelled',
            type: 'int',
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
            name: 'senderStakeKeyHash',
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

    await queryRunner.createForeignKeys('order_book_orders', [
      new TableForeignKey({
        columnNames: ['orderBookId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'order_books',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['fromTokenId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'assets',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['toTokenId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'assets',
        onDelete: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('order_book_orders', true, true, true);
  }
}
