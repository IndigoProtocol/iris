import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMetaLiquidityPools1731944573001 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE liquidity_pools ADD COLUMN meta VARCHAR(255) NULL AFTER createdSlot`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE liquidity_pools DROP COLUMN meta`,
        );
    }

}
