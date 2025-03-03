import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class CreateStakeKeyHashIndexes1731944573000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndices('liquidity_pool_swaps', [
      new TableIndex({
        columnNames: ['senderStakeKeyHash'],
        isUnique: false,
      }),
    ]);
    await queryRunner.createIndices('liquidity_pool_deposits', [
      new TableIndex({
        columnNames: ['senderStakeKeyHash'],
        isUnique: false,
      }),
    ]);
    await queryRunner.createIndices('liquidity_pool_withdraws', [
      new TableIndex({
        columnNames: ['senderStakeKeyHash'],
        isUnique: false,
      }),
    ]);
    await queryRunner.createIndices('liquidity_pool_zaps', [
      new TableIndex({
        columnNames: ['senderStakeKeyHash'],
        isUnique: false,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndices('liquidity_pool_swaps', [
      new TableIndex({
        columnNames: ['senderStakeKeyHash'],
        isUnique: false,
      }),
    ]);
    await queryRunner.dropIndices('liquidity_pool_deposits', [
      new TableIndex({
        columnNames: ['senderStakeKeyHash'],
        isUnique: false,
      }),
    ]);
    await queryRunner.dropIndices('liquidity_pool_withdraws', [
      new TableIndex({
        columnNames: ['senderStakeKeyHash'],
        isUnique: false,
      }),
    ]);
    await queryRunner.dropIndices('liquidity_pool_zaps', [
      new TableIndex({
        columnNames: ['senderStakeKeyHash'],
        isUnique: false,
      }),
    ]);
  }
}
