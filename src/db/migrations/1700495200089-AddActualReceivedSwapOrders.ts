import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActualReceivedSwapOrders1700495200089
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE liquidity_pool_swaps ADD COLUMN actualReceive BIGINT UNSIGNED NULL AFTER minReceive`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE liquidity_pool_swaps DROP COLUMN actualReceive`
    );
  }
}
