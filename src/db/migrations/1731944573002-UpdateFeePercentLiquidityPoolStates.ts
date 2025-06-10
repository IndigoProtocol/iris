import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateFeePercentLiquidityPoolStates1731944573002 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE liquidity_pool_states ADD COLUMN sellFeePercent FLOAT AFTER feePercent`,
        );
        await queryRunner.query(
            `ALTER TABLE liquidity_pool_states RENAME COLUMN feePercent TO buyFeePercent`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE liquidity_pools DROP COLUMN sellFeePercent`,
        );
        await queryRunner.query(
            `ALTER TABLE liquidity_pool_states RENAME COLUMN buyFeePercent TO feePercent`,
        );
    }

}
