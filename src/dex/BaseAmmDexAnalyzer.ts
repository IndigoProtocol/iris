import { AmmDexOperation, Transaction, Utxo } from '../types';
import { dbService } from '../indexerServices';
import { EntityManager } from 'typeorm';
import { LiquidityPool } from '../db/entities/LiquidityPool';
import { scriptHashToAddress } from '../utils';
import { DexOperationStatus } from '../constants';
import { OperationStatus } from '../db/entities/OperationStatus';
import { LiquidityPoolState } from '../db/entities/LiquidityPoolState';
import { LiquidityPoolSwap } from '../db/entities/LiquidityPoolSwap';
import { LiquidityPoolDeposit } from '../db/entities/LiquidityPoolDeposit';
import { LiquidityPoolZap } from '../db/entities/LiquidityPoolZap';
import { LiquidityPoolWithdraw } from '../db/entities/LiquidityPoolWithdraw';
import { IndexerApplication } from '../IndexerApplication';

export abstract class BaseAmmDexAnalyzer {

    public app: IndexerApplication;

    constructor(app: IndexerApplication) {
        this.app = app;
    }

    public abstract analyzeTransaction(transaction: Transaction): Promise<AmmDexOperation[]>;

    protected abstract liquidityPoolStates(transaction: Transaction): Promise<LiquidityPoolState[]> | LiquidityPoolState[];

    protected abstract swapOrders(transaction: Transaction): Promise<LiquidityPoolSwap[]> | LiquidityPoolSwap[];

    protected abstract depositOrders(transaction: Transaction): Promise<LiquidityPoolDeposit[]> | LiquidityPoolDeposit[];

    protected abstract withdrawOrders(transaction: Transaction): Promise<LiquidityPoolWithdraw[]> | LiquidityPoolWithdraw[];

    protected abstract zapOrders(transaction: Transaction): Promise<LiquidityPoolZap[]> | LiquidityPoolZap[];

    /**
     * Attempts to retrieve a liquidity pool from its identifier.
     */
    protected async liquidityPoolFromIdentifier(identifier: string): Promise<LiquidityPool | undefined> {
        const cacheInstance: LiquidityPool | undefined = await this.app.cache.getKey(identifier);

        if (cacheInstance) return cacheInstance;

        return await dbService.transaction(async (manager: EntityManager) => {
            return await manager.findOneBy(LiquidityPool, {
                identifier: identifier,
            }) ?? undefined;
        });
    }

    /**
     * Retrieve the corresponding spent operations for a transaction.
     */
    protected spentOperationInputs(transaction: Transaction): OperationStatus[] {
        const indexes: number[] = Object.keys(transaction.redeemers).filter((label: string) => {
            return label.startsWith('spend');
        }).map((label: string) => {
            return parseInt(label.split(':')[1]);
        });

        return transaction.inputs.reduce((spentInputs: OperationStatus[], input: Utxo, index: number) => {
            if (indexes.includes(index)) {
                spentInputs.push(
                    OperationStatus.make(
                        DexOperationStatus.Complete,
                        transaction.blockSlot,
                        transaction.hash,
                        index,
                        input.forTxHash,
                        input.index,
                        undefined,
                        undefined,
                    )
                );
            }

            return spentInputs;
        }, []);
    }

    /**
     * Retrieve the possible operations used in a cancel operation.
     */
    protected cancelledOperationInputs(transaction: Transaction, orderAddresses: string[], redeemerDatum: string): OperationStatus[] {
        const containsOrderAddress: boolean = transaction.scriptHashes?.some((scriptHash: string) => {
           return orderAddresses.includes(scriptHashToAddress(scriptHash));
        }) ?? false;

        if (! containsOrderAddress) return [];

        return transaction.inputs.reduce((cancelInputs: OperationStatus[], input: Utxo, index: number) => {
            const redeemerLabel: string = `spend:${index}`;

            if ((redeemerLabel in transaction.redeemers) && transaction.redeemers[redeemerLabel] === redeemerDatum) {
                cancelInputs.push(
                    OperationStatus.make(
                        DexOperationStatus.Cancelled,
                        transaction.blockSlot,
                        transaction.hash,
                        index,
                        input.forTxHash,
                        input.index
                    )
                );
            }

            return cancelInputs;
        }, []);
    }

}
