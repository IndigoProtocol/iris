import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMetaLiquidityPoolZaps1712896788861
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE liquidity_pool_zaps ADD COLUMN meta VARCHAR(255) NULL AFTER outputIndex`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE liquidity_pool_zaps DROP COLUMN meta`);
  }
}
