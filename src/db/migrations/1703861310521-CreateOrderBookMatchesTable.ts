import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateOrderBookMatchesTable1703861310521
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'order_book_matches',
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
            name: 'referenceOrderId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'matchedTokenId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'matchedAmount',
            type: 'bigint',
            unsigned: true,
          },
          {
            name: 'receiverPubKeyHash',
            type: 'varchar',
          },
          {
            name: 'receiverStakeKeyHash',
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

    await queryRunner.createForeignKeys('order_book_matches', [
      new TableForeignKey({
        columnNames: ['orderBookId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'order_books',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['referenceOrderId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'order_book_orders',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['matchedTokenId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'assets',
        onDelete: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('order_book_matches', true, true, true);
  }
}
