import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class CreateIndexes1714923640130 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndices('liquidity_pool_swaps', [
      new TableIndex({
        columnNames: ['slot'],
        isUnique: false,
      }),
    ]);
    await queryRunner.createIndices('liquidity_pool_swaps', [
      new TableIndex({
        columnNames: ['txHash'],
        isUnique: false,
      }),
    ]);
    await queryRunner.createIndices('liquidity_pool_deposits', [
      new TableIndex({
        columnNames: ['slot'],
        isUnique: false,
      }),
    ]);
    await queryRunner.createIndices('liquidity_pool_withdraws', [
      new TableIndex({
        columnNames: ['slot'],
        isUnique: false,
      }),
    ]);
    await queryRunner.createIndices('liquidity_pool_zaps', [
      new TableIndex({
        columnNames: ['slot'],
        isUnique: false,
      }),
    ]);
    await queryRunner.createIndices('operation_statuses', [
      new TableIndex({
        columnNames: ['operationId', 'operationType'],
        isUnique: false,
      }),
    ]);
    await queryRunner.createIndices('liquidity_pools', [
      new TableIndex({
        columnNames: ['dex', 'identifier'],
        isUnique: true,
      }),
      new TableIndex({
        columnNames: ['tokenAId', 'tokenBId'],
        isUnique: false,
      }),
    ]);
    await queryRunner.createIndices('order_book_orders', [
      new TableIndex({
        columnNames: ['txHash', 'senderPubKeyHash', 'senderStakeKeyHash'],
        isUnique: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndices('liquidity_pool_swaps', [
      new TableIndex({
        columnNames: ['slot'],
        isUnique: false,
      }),
    ]);
    await queryRunner.dropIndices('liquidity_pool_swaps', [
      new TableIndex({
        columnNames: ['txHash'],
        isUnique: false,
      }),
    ]);
    await queryRunner.dropIndices('liquidity_pool_deposits', [
      new TableIndex({
        columnNames: ['slot'],
        isUnique: false,
      }),
    ]);
    await queryRunner.dropIndices('liquidity_pool_withdraws', [
      new TableIndex({
        columnNames: ['slot'],
        isUnique: false,
      }),
    ]);
    await queryRunner.dropIndices('liquidity_pool_zaps', [
      new TableIndex({
        columnNames: ['slot'],
        isUnique: false,
      }),
    ]);
    await queryRunner.dropIndices('operation_statuses', [
      new TableIndex({
        columnNames: ['operationId', 'operationType'],
        isUnique: false,
      }),
    ]);
    await queryRunner.dropIndices('liquidity_pools', [
      new TableIndex({
        columnNames: ['dex', 'identifier'],
        isUnique: true,
      }),
      new TableIndex({
        columnNames: ['tokenAId', 'tokenBId'],
        isUnique: false,
      }),
    ]);
    await queryRunner.dropIndices('order_book_orders', [
      new TableIndex({
        columnNames: ['txHash', 'senderPubKeyHash', 'senderStakeKeyHash'],
        isUnique: true,
      }),
    ]);
  }
}
