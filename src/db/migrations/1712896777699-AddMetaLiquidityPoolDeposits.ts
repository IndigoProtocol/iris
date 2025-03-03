import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMetaLiquidityPoolDeposits1712896777699
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE liquidity_pool_deposits ADD COLUMN meta VARCHAR(255) NULL AFTER outputIndex`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE liquidity_pool_deposits DROP COLUMN meta`
    );
  }
}
