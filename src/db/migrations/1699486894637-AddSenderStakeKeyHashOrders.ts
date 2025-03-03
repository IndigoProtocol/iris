import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSenderStakeKeyHashOrders1699486894637
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE liquidity_pool_swaps ADD COLUMN senderStakeKeyHash VARCHAR(56) NULL AFTER senderPubKeyHash`
    );
    await queryRunner.query(
      `ALTER TABLE liquidity_pool_deposits ADD COLUMN senderStakeKeyHash VARCHAR(56) NULL AFTER senderPubKeyHash`
    );
    await queryRunner.query(
      `ALTER TABLE liquidity_pool_withdraws ADD COLUMN senderStakeKeyHash VARCHAR(56) NULL AFTER senderPubKeyHash`
    );
    await queryRunner.query(
      `ALTER TABLE liquidity_pool_zaps ADD COLUMN senderStakeKeyHash VARCHAR(56) NULL AFTER senderPubKeyHash`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE liquidity_pool_swaps DROP COLUMN senderStakeKeyHash`
    );
    await queryRunner.query(
      `ALTER TABLE liquidity_pool_deposits DROP COLUMN senderStakeKeyHash`
    );
    await queryRunner.query(
      `ALTER TABLE liquidity_pool_withdraws DROP COLUMN senderStakeKeyHash`
    );
    await queryRunner.query(
      `ALTER TABLE liquidity_pool_withdraws DROP COLUMN senderStakeKeyHash`
    );
  }
}
