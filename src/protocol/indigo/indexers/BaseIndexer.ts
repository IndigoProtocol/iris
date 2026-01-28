import { BlockPraos, Slot } from '@cardano-ogmios/schema';
import { CoreDatabase } from '../db/CoreDatabase';

export abstract class BaseIndexer {
    constructor(protected database: CoreDatabase) {}

    abstract onBlock(block: BlockPraos): Promise<any>;
    abstract onRollback(blockHash: string, slot: Slot): Promise<any>;
}
