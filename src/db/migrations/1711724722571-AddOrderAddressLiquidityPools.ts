import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderAddressLiquidityPools1711724722571 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE liquidity_pools ADD COLUMN orderAddress VARCHAR(255) NULL AFTER address`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE liquidity_pools DROP COLUMN orderAddress`,
        );
    }

}
