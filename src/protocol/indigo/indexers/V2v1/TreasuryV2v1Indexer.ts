import { BlockPraos, Transaction, TransactionOutput, Slot } from '@cardano-ogmios/schema';
import { BaseV2v1Indexer } from './BaseV2v1Indexer';
import { decodeBech32 } from '../../helpers';

/**
 * This Indexer updates the database with collector records.
 */
export class TreasuryV2v1Indexer extends BaseV2v1Indexer {
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
        await Promise.all(
            tx.outputs.map(async (output: TransactionOutput, index: number) => {
                const decodedAddress = decodeBech32(output.address);
                if (decodedAddress && decodedAddress.indexOf(this.sysParams.validatorHashes.treasuryHash) > -1) {
                    console.log('Found treasury output', output);
                    this.database.insertTreasury({
                        slot: slot,
                        output_hash: tx.id,
                        output_index: index,
                        lovelace_value: output.value.ada.lovelace,
                        version: 'v2.1'
                    })
                }
            })
        );
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
