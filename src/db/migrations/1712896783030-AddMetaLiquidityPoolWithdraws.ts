import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMetaLiquidityPoolWithdraws1712896783030
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE liquidity_pool_withdraws ADD COLUMN meta VARCHAR(255) NULL AFTER outputIndex`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE liquidity_pool_withdraws DROP COLUMN meta`
    );
  }
}
