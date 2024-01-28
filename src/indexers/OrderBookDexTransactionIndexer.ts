import { BaseIndexer } from './BaseIndexer';
import { BlockAlonzo, BlockBabbage, Slot, TxAlonzo, TxBabbage } from '@cardano-ogmios/schema';
import { OrderBookDexOperation } from '../types';
import { dbService, eventService } from '../indexerServices';
import { EntityManager, MoreThan } from 'typeorm';
import { logInfo } from '../logger';
import { formatTransaction } from '../utils';
import { OrderBookOrder } from '../db/entities/OrderBookOrder';
import { BaseOrderBookDexAnalyzer } from '../dex/BaseOrderBookDexAnalyzer';
import { IndexerEventType } from '../constants';
import { OrderBookMatch } from '../db/entities/OrderBookMatch';
import { OrderBook } from '../db/entities/OrderBook';

export class OrderBookDexTransactionIndexer extends BaseIndexer {

    private _analyzers: BaseOrderBookDexAnalyzer[];

    constructor(analyzers: BaseOrderBookDexAnalyzer[]) {
        super();

        this._analyzers = analyzers;
    }

    async onRollForward(block: BlockBabbage | BlockAlonzo): Promise<any> {
        const operationPromises: Promise<OrderBookDexOperation[]>[] = block.body?.map((transaction: TxBabbage | TxAlonzo) => {
            return this._analyzers.map((analyzer: BaseOrderBookDexAnalyzer) => {
                return analyzer.analyzeTransaction(
                    formatTransaction(block, transaction)
                );
            });
        }).flat(2);

        return await Promise.all(operationPromises)
            .then(async (operationsUnSorted: OrderBookDexOperation[][]) => {
                const operations: OrderBookDexOperation[] = operationsUnSorted.flat();

                const sortedOperations: OrderBookDexOperation[] = operations
                    .sort((a: OrderBookDexOperation, b: OrderBookDexOperation) => {
                        if (a instanceof OrderBookOrder) {
                            return -1;
                        }
                        if (b instanceof OrderBookOrder) {
                            return 1;
                        }
                        return 0;
                    })
                    .sort((a: OrderBookDexOperation, b: OrderBookDexOperation) => {
                        const inMatch = (orderIdentifier: string): boolean => {
                            return operations.some((operation: OrderBookDexOperation) => {
                                if (! (operation instanceof OrderBookOrder)) return false;

                                return operation.identifier === orderIdentifier;
                            });
                        }

                        if (a instanceof OrderBookMatch && a.referenceOrder && inMatch(a.referenceOrder.identifier)) {
                            return -1;
                        }
                        if (b instanceof OrderBookMatch && b.referenceOrder && inMatch(b.referenceOrder.identifier)) {
                            return 1;
                        }
                        return 0;
                    });

                for (const operation of sortedOperations) {
                    await eventService.pushEvent({
                        type: IndexerEventType.OrderBookDexOperation,
                        data: operation,
                    });
                }
            });
    }

    async onRollBackward(blockHash: string, slot: Slot): Promise<any> {
        return await dbService.transaction(async (manager: EntityManager) => {
            const whereSlotClause = {
                slot: MoreThan(slot),
            };

            return Promise.all([
                manager.delete(OrderBookOrder, whereSlotClause),
                manager.delete(OrderBookMatch, whereSlotClause),
                manager.delete(OrderBook, {
                    createdSlot: MoreThan(slot),
                }),
            ]).then(() => {
                logInfo('Removed entities');
            });
        });
    }

}
