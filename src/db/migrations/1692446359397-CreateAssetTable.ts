import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatAssetTable1692446359397 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'assets',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'policyId',
            type: 'varchar(56)',
          },
          {
            name: 'nameHex',
            type: 'varchar',
          },
          {
            name: 'isLpToken',
            type: 'boolean',
          },
          {
            name: 'isVerified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'decimals',
            type: 'int',
            isNullable: true,
            default: null,
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'ticker',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'logo',
            type: 'longtext',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'longtext',
            isNullable: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'assets',
      new TableIndex({
        columnNames: ['policyId', 'nameHex'],
        isUnique: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('assets', true, true, true);
  }
}
