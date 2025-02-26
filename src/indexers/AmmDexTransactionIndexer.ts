import { BaseIndexer } from './BaseIndexer';
import { Slot, BlockPraos, Transaction as OgmiosTransaction } from '@cardano-ogmios/schema';
import { BaseAmmDexAnalyzer } from '../dex/BaseAmmDexAnalyzer';
import { AmmDexOperation, Transaction } from '../types';
import { dbService } from '../indexerServices';
import { LiquidityPoolState } from '../db/entities/LiquidityPoolState';
import { OperationStatus } from '../db/entities/OperationStatus';
import { logInfo } from '../logger';
import { formatTransaction } from '../utils';
import { slotToUnixTime} from "@lucid-evolution/lucid";
import { AmmOperationHandler } from '../handlers/AmmOperationHandler';

export class AmmDexTransactionIndexer extends BaseIndexer {

    private _analyzers: BaseAmmDexAnalyzer[];
    private _handler: AmmOperationHandler;

    constructor(analyzers: BaseAmmDexAnalyzer[]) {
        super();

        this._analyzers = analyzers;
        this._handler = new AmmOperationHandler();
    }

    async onRollForward(block: BlockPraos): Promise<any> {
        const operationPromises: Promise<AmmDexOperation[]>[] = (block.transactions ?? []).map((transaction: OgmiosTransaction) => {
            return this._analyzers.map((analyzer: BaseAmmDexAnalyzer) => {
                const tx: Transaction = formatTransaction(block, transaction);

                if (analyzer.startSlot > tx.blockSlot) return [];

                return analyzer.analyzeTransaction(tx);
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
                    await this._handler.handle(operation);
                }
            });
    }

    async onRollBackward(blockHash: string, slot: Slot): Promise<any> {
        // Raw delete with for better performance
        await dbService.dbSource.query("DELETE FROM operation_statuses WHERE slot > ?", [slot]);
        await dbService.dbSource.query("DELETE FROM liquidity_pool_states WHERE slot > ?", [slot]);
        await dbService.dbSource.query("DELETE FROM liquidity_pool_deposits WHERE slot > ?", [slot]);
        await dbService.dbSource.query("DELETE FROM liquidity_pool_withdraws WHERE slot > ?", [slot]);
        await dbService.dbSource.query("DELETE FROM liquidity_pool_swaps WHERE slot > ?", [slot]);
        await dbService.dbSource.query("DELETE FROM liquidity_pool_zaps WHERE slot > ?", [slot]);
        await dbService.dbSource.query("DELETE FROM liquidity_pools WHERE createdSlot > ?", [slot]);
        await dbService.dbSource.query("DELETE FROM liquidity_pool_ticks WHERE time > ?", [slotToUnixTime("Mainnet", slot) / 1000]);

        logInfo('Removed AMM entities');
    }

}
