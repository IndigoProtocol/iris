import { CoreDatabase } from '../../db/CoreDatabase';
import { BaseIndexer } from '../BaseIndexer';
import { SystemParamsV2v1 } from '../../models/SystemParamsV2v1';

export abstract class BaseV2v1Indexer extends BaseIndexer {
    constructor(protected database: CoreDatabase, protected sysParams: SystemParamsV2v1) {
        super(database);
    }
}
