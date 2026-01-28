import { AmmDexOperation, ProtocolOperation, Transaction } from '../types';
import { IndexerApplication } from '../IndexerApplication';
import { BlockPraos } from '@cardano-ogmios/schema';

export abstract class BaseProtocolAnalyzer {

    public app: IndexerApplication;

    public abstract startSlot: number;

    constructor(app: IndexerApplication) {
        this.app = app;
    }

    public abstract analyzeTransaction(transaction: Transaction): Promise<ProtocolOperation[]>;

    public onBlock?(block: BlockPraos): Promise<any>;

}
