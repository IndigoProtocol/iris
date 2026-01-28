import { BlockPraos, Transaction, TransactionOutput, Slot } from '@cardano-ogmios/schema';
import { BaseV2v1Indexer } from './BaseV2v1Indexer';
import { getCdpCreatorAddress } from '../../models/SystemParamsV2v1';
import config from '../../config';

/**
 * This Indexer updates the database with collector records.
 */
export class CdpCreatorV2v1Indexer extends BaseV2v1Indexer {
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
        const cdpCreatorAddress = getCdpCreatorAddress(this.sysParams, config.NETWORK_ID);
        const inputsMapped = tx.inputs.map((x) => [x.transaction.id, x.index]) as [
            string,
            number
        ][];

        // Mark collector inputs as consumed
        await this.database.markCdpCreatorInputsAsConsumed(slot, inputsMapped);

        const cdpCreatorTokenCs = this.sysParams.cdpCreatorParams.cdpCreatorNft[0].unCurrencySymbol;
        const cdpCreatorTokenTokenName = Buffer.from(this.sysParams.cdpCreatorParams.cdpCreatorNft[1].unTokenName).toString('hex');
        
        await Promise.all(
            tx.outputs.map((out: TransactionOutput, index: number) => {
                    if (
                        cdpCreatorTokenCs in out.value && 
                        cdpCreatorTokenTokenName in out.value[cdpCreatorTokenCs] && 
                        out.value[cdpCreatorTokenCs][cdpCreatorTokenTokenName] === 1n &&
                        out.address === cdpCreatorAddress
                    ) {
                        this.database.insertCdpCreator({
                            slot: slot,
                            output_hash: tx.id,
                            output_index: index,
                            version: 'v2.1'
                        })
                    }
                }
            )
        );
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
