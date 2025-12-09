import { BaseIndexer } from './BaseIndexer';
import { Slot, BlockPraos, Transaction as OgmiosTransaction } from '@cardano-ogmios/schema';
import { ProtocolOperation, Transaction } from '../types';
import { logInfo } from '../logger';
import { formatTransaction } from '../utils';
import { BaseProtocolAnalyzer } from '../protocol/BaseProtocolAnalyzer';
import { ProtocolOperationHandler } from '../handlers/ProtocolOperationHandler';

export class ProtocolTransactionIndexer extends BaseIndexer {

    private _analyzers: BaseProtocolAnalyzer[];
    private _handler: ProtocolOperationHandler;

    constructor(analyzers: BaseProtocolAnalyzer[]) {
        super();

        this._analyzers = analyzers;
        this._handler = new ProtocolOperationHandler();
    }

    async onRollForward(block: BlockPraos): Promise<any> {
        const operationPromises: Promise<ProtocolOperation[]>[] = (block.transactions ?? []).map((transaction: OgmiosTransaction) => {
            return this._analyzers.map((analyzer: BaseProtocolAnalyzer) => {
                const tx: Transaction = formatTransaction(block, transaction);

                if (analyzer.startSlot > tx.blockSlot) return [];

                return analyzer.analyzeTransaction(tx);
            });
        }).flat(2);

        return await Promise.all(operationPromises)
            .then(async (operationsUnSorted: ProtocolOperation[][]) => {
                const operations: ProtocolOperation[] = operationsUnSorted.flat();

                // Synchronize updates. 'forEach' is not sequential
                for (const operation of operations) {
                    await this._handler.handle(operation);
                }
            });
    }

    async onRollBackward(blockHash: string, slot: Slot): Promise<any> {
        logInfo('Removed protocol entities');
    }

}
