import { BaseIndexer } from './BaseIndexer';
import { BlockAlonzo, BlockBabbage, Slot, TxAlonzo, TxBabbage } from '@cardano-ogmios/schema';
import { BaseAmmDexAnalyzer } from '../dex/BaseAmmDexAnalyzer';
import { AmmDexOperation } from '../types';
import { IndexerEventType } from '../constants';
import { dbService, eventService } from '../indexerServices';
import { LiquidityPoolState } from '../db/entities/LiquidityPoolState';
import { EntityManager, MoreThan } from 'typeorm';
import { LiquidityPoolDeposit } from '../db/entities/LiquidityPoolDeposit';
import { LiquidityPoolWithdraw } from '../db/entities/LiquidityPoolWithdraw';
import { LiquidityPoolSwap } from '../db/entities/LiquidityPoolSwap';
import { LiquidityPoolZap } from '../db/entities/LiquidityPoolZap';
import { OperationStatus } from '../db/entities/OperationStatus';
import { logInfo } from '../logger';
import { LiquidityPool } from '../db/entities/LiquidityPool';
import { formatTransaction } from '../utils';

export class AmmDexTransactionIndexer extends BaseIndexer {

    private _analyzers: BaseAmmDexAnalyzer[];

    constructor(analyzers: BaseAmmDexAnalyzer[]) {
        super();

        this._analyzers = analyzers;
    }

    async onRollForward(block: BlockBabbage | BlockAlonzo): Promise<any> {
        const operationPromises: Promise<AmmDexOperation[]>[] = block.body?.map((transaction: TxBabbage | TxAlonzo) => {
            return this._analyzers.map((analyzer: BaseAmmDexAnalyzer) => {
                return analyzer.analyzeTransaction(
                    formatTransaction(block, transaction)
                );
            });
        }).flat(2);

        return await Promise.all(operationPromises)
            .then(async (operationsUnSorted: AmmDexOperation[][]) => {
                const operations: AmmDexOperation[] = operationsUnSorted.flat();

                const sortedOperations: AmmDexOperation[] = operations
                    .sort((a: AmmDexOperation, b: AmmDexOperation) => {
                        // Prioritize new LP states before other operations
                        if (a instanceof LiquidityPoolState) {
                            return -1;
                        }
                        if (b instanceof LiquidityPoolState) {
                            return 1;
                        }
                        return 0;
                    })
                    .sort((a: AmmDexOperation, b: AmmDexOperation) => {
                        // Prioritize orders if in same block as corresponding state
                        const inLpState = (txHash: string): boolean => {
                            return operations.some((operation: AmmDexOperation) => {
                                if (! (operation instanceof LiquidityPoolState)) return false;

                                const operationTxHashes: string[] = operation.possibleOperationInputs
                                    .map((operationInput: OperationStatus) => operationInput.operationTxHash);

                                return operationTxHashes.includes(txHash);
                            });
                        }

                        if (inLpState(a.txHash)) {
                            return -1;
                        }
                        if (inLpState(b.txHash)) {
                            return 1;
                        }
                        return 0;
                    });

                // Synchronize updates. 'forEach' is not sequential
                for (const operation of sortedOperations) {
                    await eventService.pushEvent({
                        type: IndexerEventType.AmmDexOperation,
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
                manager.delete(OperationStatus, whereSlotClause),
                manager.delete(LiquidityPoolState, whereSlotClause),
                manager.delete(LiquidityPoolDeposit, whereSlotClause),
                manager.delete(LiquidityPoolWithdraw, whereSlotClause),
                manager.delete(LiquidityPoolSwap, whereSlotClause),
                manager.delete(LiquidityPoolZap, whereSlotClause),
                manager.delete(LiquidityPool, {
                    createdSlot: MoreThan(slot),
                }),
            ]).then(() => {
                logInfo('Removed AMM entities');
            });
        });
    }

}
