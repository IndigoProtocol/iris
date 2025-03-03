import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateSyncsTable1693421645762 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'syncs',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'slot',
            type: 'bigint',
            unsigned: true,
          },
          {
            name: 'blockHash',
            type: 'varchar(64)',
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('syncs', true);
  }
}
