import { BaseService } from './BaseService';
import { EntityManager, QueryRunner } from 'typeorm';
import { dbSource } from '../db/data-source';
import { logError, logInfo } from '../logger';
import CONFIG from '../config';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';
import { ApplicationContext } from '../constants';

export class DatabaseService extends BaseService {

    private readonly _context: ApplicationContext;

    constructor(context: ApplicationContext) {
        super();

        this._context = context;
    }

    public boot(): Promise<any> {
        if (! CONFIG.MYSQL_USERNAME || ! CONFIG.MYSQL_DATABASE) {
            return Promise.reject('Database config not set.');
        }

        return dbSource.initialize()
            .then(() => {
                logInfo('Database connected', this._context);
            })
            .catch((reason) => {
                return Promise.reject(`Failed to load database. ${reason}`);
            });
    }

    get isInitialized(): boolean {
        return dbSource.isInitialized;
    }

    /**
     * Sandwich some logic that requires a DB transaction.
     */
    public async transaction(logicFunc: (manager: EntityManager) => any, retryOnDuplicate: boolean = false, isolationLevel: IsolationLevel = 'READ UNCOMMITTED'): Promise<any> {
        const query: QueryRunner = dbSource.createQueryRunner();

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
        const query: QueryRunner = dbSource.createQueryRunner();

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
