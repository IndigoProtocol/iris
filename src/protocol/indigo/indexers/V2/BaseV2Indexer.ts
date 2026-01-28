import { CoreDatabase } from '../../db/CoreDatabase';
import { BaseIndexer } from '../BaseIndexer';
import { SystemParamsV2 } from '../../models/SystemParamsV2';

export abstract class BaseV2Indexer extends BaseIndexer {
    constructor(protected database: CoreDatabase, protected sysParams: SystemParamsV2) {
        super(database);
    }
}
