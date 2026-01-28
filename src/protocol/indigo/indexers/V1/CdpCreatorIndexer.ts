import { BlockPraos, Transaction, TransactionOutput, Slot } from '@cardano-ogmios/schema';
import { BaseV1Indexer } from './BaseV1Indexer';
import { assetClassToString } from '../../helpers';
import CONFIG from '../../config';

/**
 * This Indexer updates the database with collector records.
 */
export class CdpCreatorIndexer extends BaseV1Indexer {
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
        const inputsMapped = tx.inputs.map((x) => [x.transaction.id, x.index]) as [
            string,
            number
        ][];

        // Mark collector inputs as consumed
        await this.database.markCdpCreatorInputsAsConsumed(slot, inputsMapped);

        const cdpCreatorTokenCs = this.sysParams.cdpCreatorParams.cdpCreatorNft[0].unCurrencySymbol;
        const cdpCreatorTokenTokenName = Buffer.from(this.sysParams.cdpCreatorParams.cdpCreatorNft[1].unTokenName).toString('hex');
        const cdpCreatorOutputs = tx.outputs.filter(
            (out) => 
                cdpCreatorTokenCs in out.value && 
                cdpCreatorTokenTokenName in out.value[cdpCreatorTokenCs] && 
                out.value[cdpCreatorTokenCs][cdpCreatorTokenTokenName] === 1n &&
                out.address === CONFIG.V1_CDP_CREATOR_ADDRESS
        );
        if (cdpCreatorOutputs.length > 0) {
            await Promise.all(
                cdpCreatorOutputs.map((output: TransactionOutput, index: number) =>
                    this.database.insertCdpCreator({
                        slot: slot,
                        output_hash: tx.id,
                        output_index: index,
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
            this.database.deleteCdpCreatorBySlot(slot),
            this.database.unmarkConsumedCdpCreatorBySlot(slot),
        ]);
    }
}
