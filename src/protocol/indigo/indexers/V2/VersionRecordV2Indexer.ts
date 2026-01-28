import { BlockPraos, Transaction, TransactionOutput, Slot } from '@cardano-ogmios/schema';
import { BaseV2Indexer } from './BaseV2Indexer';
import { assetClassToString } from '../../helpers';
import CONFIG from '../../config';
import { stringify } from '../../../../utils';

/**
 * This Indexer updates the database with collector records.
 */
export class VersionRecordV2Indexer extends BaseV2Indexer {
    /**
     * On Block: Search for any outputs with the collector UTxO
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
     * Looks for an outputs to the collector address.
     */
    async processTransaction(tx: Transaction, slot: Slot) {
        const versionRecordTokenCs = this.sysParams.cdpCreatorParams.versionRecordToken[0].unCurrencySymbol;
        const versionRecordTokenTokenName = Buffer.from(this.sysParams.cdpCreatorParams.versionRecordToken[1].unTokenName).toString('hex');
        const versionRecordOutputs = tx.outputs.filter(
            (out) => 
                versionRecordTokenCs in out.value && 
                versionRecordTokenTokenName in out.value[versionRecordTokenCs] && 
                out.value[versionRecordTokenCs][versionRecordTokenTokenName] === 1n
        );
        if (versionRecordOutputs.length > 0) {
            await Promise.all(
                versionRecordOutputs.map((output: TransactionOutput, index: number) => {
                    const outputIndex = tx.outputs.indexOf(output);
                    return this.database.insertVersionRecord({
                        slot: slot,
                        output_hash: tx.id,
                        output_index: outputIndex,
                        data: stringify(output.datum),
                        version: 'v2'
                    })
                })
            );
        }
    }

    /**
     * On rollback: Clean up transactions.
     */
    onRollback(blockHash: string, slot: number): Promise<any> {
        return Promise.all([
            this.database.deleteVersionRecordBySlot(slot),
            this.database.unmarkConsumedVersionRecordBySlot(slot),
        ]);
    }
}
