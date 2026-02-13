import { CoreDatabase } from '../../db/CoreDatabase';
import { BaseIndexer } from '../BaseIndexer';
import { SystemParamsV1 } from '../../models/SystemParamsV1';

export abstract class BaseV1Indexer extends BaseIndexer {
    constructor(protected database: CoreDatabase, protected sysParams: SystemParamsV1) {
        super(database);
    }
}
