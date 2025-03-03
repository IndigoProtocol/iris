import { BaseIndexer } from './BaseIndexer';
import {
  Slot,
  BlockPraos,
  Transaction as OgmiosTransaction,
} from '@cardano-ogmios/schema';
import { HybridOperation, Transaction } from '../types';
import { LiquidityPoolState } from '../db/entities/LiquidityPoolState';
import { OperationStatus } from '../db/entities/OperationStatus';
import { formatTransaction } from '../utils';
import { BaseHybridDexAnalyzer } from '../dex/BaseHybridDexAnalyzer';
import { HybridOperationHandler } from '../handlers/HybridOperationHandler';
import { OrderBookOrder } from '../db/entities/OrderBookOrder';
import { OrderBookMatch } from '../db/entities/OrderBookMatch';

export class HybridDexTransactionIndexer extends BaseIndexer {
  private _analyzers: BaseHybridDexAnalyzer[];
  private _handler: HybridOperationHandler;

  constructor(analyzers: BaseHybridDexAnalyzer[]) {
    super();

    this._analyzers = analyzers;
    this._handler = new HybridOperationHandler();
  }

  async onRollForward(block: BlockPraos): Promise<any> {
    const operationPromises: Promise<HybridOperation[]>[] = (
      block.transactions ?? []
    )
      .map((transaction: OgmiosTransaction) => {
        return this._analyzers.map((analyzer: BaseHybridDexAnalyzer) => {
          const tx: Transaction = formatTransaction(block, transaction);

          if (analyzer.startSlot > tx.blockSlot) return [];

          return analyzer.analyzeTransaction(tx);
        });
      })
      .flat(2);

    return await Promise.all(operationPromises).then(
      async (operationsUnSorted: HybridOperation[][]) => {
        const operations: HybridOperation[] = operationsUnSorted.flat();

        const sortedOperations: HybridOperation[] = operations
          .sort((a: HybridOperation, b: HybridOperation) => {
            // Prioritize new LP states before other operations
            if (a instanceof LiquidityPoolState) {
              return -1;
            }
            if (b instanceof LiquidityPoolState) {
              return 1;
            }
            return 0;
          })
          .sort((a: HybridOperation, b: HybridOperation) => {
            // Prioritize orders if in same block as corresponding state
            const inLpState = (txHash: string): boolean => {
              return operations.some((operation: HybridOperation) => {
                if (!(operation instanceof LiquidityPoolState)) return false;

                const operationTxHashes: string[] =
                  operation.possibleOperationInputs.map(
                    (operationInput: OperationStatus) =>
                      operationInput.operationTxHash
                  );

                return operationTxHashes.includes(txHash);
              });
            };
            const inMatch = (orderIdentifier: string): boolean => {
              return operations.some((operation: HybridOperation) => {
                if (!(operation instanceof OrderBookOrder)) return false;

                return operation.identifier === orderIdentifier;
              });
            };

            if (
              inLpState(a.txHash) ||
              (a instanceof OrderBookMatch &&
                a.referenceOrder &&
                inMatch(a.referenceOrder.identifier))
            ) {
              return -1;
            }
            if (
              inLpState(b.txHash) ||
              (b instanceof OrderBookMatch &&
                b.referenceOrder &&
                inMatch(b.referenceOrder.identifier))
            ) {
              return 1;
            }
            return 0;
          });

        // Synchronize updates. 'forEach' is not sequential
        for (const operation of sortedOperations) {
          await this._handler.handle(operation);
        }
      }
    );
  }

  async onRollBackward(blockHash: string, slot: Slot): Promise<any> {
    return Promise.resolve();
  }
}
