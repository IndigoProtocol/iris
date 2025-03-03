import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPoolStateExtra1740988442173 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE liquidity_pool_states ADD COLUMN extra JSON NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE liquidity_pool_states DROP COLUMN extra`,
    );
  }
}
