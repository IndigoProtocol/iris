import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMetaAssets1715612872956 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE assets ADD COLUMN meta VARCHAR(255) NULL AFTER description`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE assets DROP COLUMN meta`);
  }
}
