import { BlockPraos, Transaction, TransactionOutput, Slot } from '@cardano-ogmios/schema';
import { BaseV2Indexer } from './BaseV2Indexer';
import { getTreasuryAddress } from '../../models/SystemParamsV2';
import config from '../../config';

/**
 * This Indexer updates the database with collector records.
 */
export class TreasuryV2Indexer extends BaseV2Indexer {
    /**
     * On Block: Search for any outputs with the treasury UTxO
     */
    onBlock(block: BlockPraos): Promise<any> {
        if (block.transactions) {
            const slot = block.slot;
            return Promise.all(
                block.transactions?.map((tx) => this.processTransaction(tx, slot)) ?? []
            );
        }
        return Promise.resolve();
    }

    /**
     * Looks for an outputs to the treasury address.
     */
    async processTransaction(tx: Transaction, slot: Slot) {
        const treasuryOutputs = tx.outputs.filter(
            (out) => out.address == getTreasuryAddress(this.sysParams, config.NETWORK_ID)
        );

        if (treasuryOutputs.length > 0) {
            await Promise.all(
                treasuryOutputs.map((output: TransactionOutput, index: number) =>
                    this.database.insertTreasury({
                        slot: slot,
                        output_hash: tx.id,
                        output_index: index,
                        lovelace_value: output.value.ada.lovelace,
                        version: 'v2'
                    })
                )
            );
        }
    }

    /**
     * On rollback: Clean up transactions.
     */
    onRollback(blockHash: string, slot: number): Promise<any> {
        return Promise.all([
            this.database.deleteTreasuryBySlot(slot),
            this.database.unmarkConsumedTreasuryBySlot(slot),
        ]);
    }
}
