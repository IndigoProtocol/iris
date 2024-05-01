import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMetaOrderBookMatches1712896807992 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE order_book_matches ADD COLUMN meta VARCHAR(255) NULL AFTER outputIndex`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE order_book_matches DROP COLUMN meta`,
        );
    }

}
