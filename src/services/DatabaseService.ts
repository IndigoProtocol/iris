import { BaseService } from './BaseService';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { logError, logInfo } from '../logger';
import CONFIG from '../config';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';
import { ApplicationContext } from '../constants';
import { IndexerApplication } from '../IndexerApplication';

export class DatabaseService extends BaseService {

    public dbSource: DataSource;

    private app: IndexerApplication;
    private readonly _context: ApplicationContext;

    constructor(context: ApplicationContext) {
        super();

        this._context = context;
    }

    public boot(app: IndexerApplication, migrations: Function[] = [], entities: Function[] = []): Promise<any> {
        if (! CONFIG.MYSQL_USERNAME || ! CONFIG.MYSQL_DATABASE) {
            return Promise.reject('Database config not set.');
        }

        this.app = app;
        this.dbSource = new DataSource({
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
            connectorPackage: 'mysql2',
            entities: [
                'dist/**/entities/*.js',
                ...entities,
            ],
            migrations: [
                'dist/**/migrations/*.js',
                ...migrations,
            ],
            migrationsTableName: 'migrations',
            migrationsRun: true,
            poolSize: 100,
        });

        return this.dbSource.initialize()
            .then(() => {
                logInfo('Database connected', this._context);
            })
            .catch((reason) => {
                return Promise.reject(`Failed to load database. ${reason}`);
            });
    }

    get isInitialized(): boolean {
        return this.dbSource.isInitialized;
    }

    /**
     * Sandwich some logic that requires a DB transaction.
     */
    public async transaction(logicFunc: (manager: EntityManager) => any, retryOnDuplicate: boolean = false, isolationLevel: IsolationLevel = 'READ UNCOMMITTED'): Promise<any> {
        const query: QueryRunner = this.dbSource.createQueryRunner();

        await query.connect();
        await query.startTransaction(isolationLevel);

        try {
            const returnData: any = await logicFunc(query.manager);

            await query.commitTransaction();
            await query.release();

            return Promise.resolve(returnData);
        } catch (error: any) {
            await query.rollbackTransaction();
            await query.release();

            if (error.code === 'ER_DUP_ENTRY' && retryOnDuplicate) {
                return await this.transaction(logicFunc, false, isolationLevel);
            }

            logError(`Transaction rollback. ${error}`, this._context);

            return Promise.reject(error);
        }
    }

    public async query(logicFunc: (manager: EntityManager) => any): Promise<any> {
        const query: QueryRunner = this.dbSource.createQueryRunner();

        await query.connect();

        try {
            const returnData: any = await logicFunc(query.manager);

            await query.release();

            return Promise.resolve(returnData);
        } catch (error) {
            await query.release();

            logError(`Query failed. ${error}`, this._context);

            return Promise.reject(error);
        }
    }

}
