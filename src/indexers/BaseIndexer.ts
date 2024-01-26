import { BlockAlonzo, BlockBabbage, Slot } from '@cardano-ogmios/schema';

export abstract class BaseIndexer {

    abstract onRollForward(block: BlockBabbage | BlockAlonzo): Promise<any>;

    abstract onRollBackward(blockHash: string, slot: Slot): Promise<any>;

}
