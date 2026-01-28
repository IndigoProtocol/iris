import { BlockPraos, Transaction, TransactionOutput, Slot } from '@cardano-ogmios/schema';
import { BaseV1Indexer } from './BaseV1Indexer';
import { assetClassToString } from '../../helpers';
import CONFIG from '../../config';

/**
 * This Indexer updates the database with collector records.
 */
export class TreasuryIndexer extends BaseV1Indexer {
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
        const inputsMapped = tx.inputs.map((x) => [x.transaction.id, x.index]) as [
            string,
            number
        ][];

        // Mark treasury inputs as consumed
        await this.database.markTreasuryInputsAsConsumed(slot, inputsMapped);

        const treasuryOutputs = tx.outputs.filter(
            (out) => out.address == CONFIG.V1_TREASURY_ADDRESS
        );

        if (treasuryOutputs.length > 0) {
            await Promise.all(
                treasuryOutputs.map((output: TransactionOutput, index: number) =>
                    this.database.insertTreasury({
                        slot: slot,
                        output_hash: tx.id,
                        output_index: index,
                        lovelace_value: output.value.ada.lovelace,
                        version: 'v1'
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
