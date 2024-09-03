import { BlockPraos, Slot } from '@cardano-ogmios/schema';

export abstract class BaseIndexer {

    abstract onRollForward(block: BlockPraos): Promise<any>;

    abstract onRollBackward(blockHash: string, slot: Slot): Promise<any>;

}
