import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMetaOrderBookOrders1712896804175 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE order_book_orders ADD COLUMN meta VARCHAR(255) NULL AFTER outputIndex`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE order_book_orders DROP COLUMN meta`,
        );
    }

}
