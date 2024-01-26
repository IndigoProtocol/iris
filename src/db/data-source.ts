import { DataSource } from 'typeorm';
import CONFIG from '../config';

/**
 * https://typeorm.io/data-source-options
 */
export const dbSource: DataSource = new DataSource({
    type: 'mysql',
    host: CONFIG.MYSQL_HOST,
    port: CONFIG.MYSQL_PORT,
    username: CONFIG.MYSQL_USERNAME,
    password: CONFIG.MYSQL_PASSWORD,
    database: CONFIG.MYSQL_DATABASE,
    debug: false,
    logging: ['error'],
    supportBigNumbers: true,
    bigNumberStrings: false,
    synchronize: false,
    entities: [
        'dist/**/entities/*.js',
    ],
    migrations: [
        'dist/**/migrations/*.js',
    ],
    migrationsTableName: 'migrations',
    migrationsRun: true,
    poolSize: 100,
});
