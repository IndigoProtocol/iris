import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMetaLiquidityPoolSwaps1712896760348
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE liquidity_pool_swaps ADD COLUMN meta VARCHAR(255) NULL AFTER outputIndex`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE liquidity_pool_swaps DROP COLUMN meta`
    );
  }
}
