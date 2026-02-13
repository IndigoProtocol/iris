import { BlockPraos, Transaction, TransactionOutput, Slot } from '@cardano-ogmios/schema';
import { BaseV2v1Indexer } from './BaseV2v1Indexer';
import config from '../../config';
import { getCollectorAddress } from '../../models/SystemParamsV2v1';

/**
 * This Indexer updates the database with collector records.
 */
export class CollectorV2v1Indexer extends BaseV2v1Indexer {
    /**
     * On Block: Search for any outputs with the collector UTxO
     */
    onBlock(block: BlockPraos): Promise<any> {
        if (block.transactions) {
            const slot = block.slot;
            return Promise.all(
                block.transactions.map((tx) => this.processTransaction(tx, slot)) ?? []
            );
        }
        return Promise.resolve();
    }

    /**
     * Looks for an outputs to the collector address.
     */
    async processTransaction(tx: Transaction, slot: Slot) {
        const collectorAddress = getCollectorAddress(this.sysParams, config.NETWORK_ID);
        const inputsMapped = tx.inputs.map((x) => [x.transaction.id, x.index]) as [
            string,
            number
        ][];

        // Mark collector inputs as consumed
        await this.database.markCollectorInputsAsConsumed(slot, inputsMapped);

        const mappedOutputs: [TransactionOutput, number][] = tx.outputs.map((output, index) => [output, index]);
        const collectorOutputs = mappedOutputs.filter(
            ([out, index]) => out.address === collectorAddress
        );
        if (collectorOutputs.length > 0) {
            const collectorInputs = await this.database.getCollectorFromOutput(
                inputsMapped
            );
            const collectorInputValue = collectorInputs.reduce(
                (prev, current) => prev + BigInt(current.ada_value),
                0n
            );
            const collectorOutputValue = collectorOutputs.reduce(
                (prev, [current, index]) => prev + BigInt(current.value.ada.lovelace),
                0n
            );

            await Promise.all(
                collectorOutputs.map(([output, index]) =>
                    this.database.insertCollector({
                        slot: slot,
                        output_hash: tx.id,
                        output_index: index,
                        ada_value: output.value.ada.lovelace,
                        version: 'v2.1'
                    })
                )
            );

            const stakingManagerCs = this.sysParams.stakingParams.stakingManagerNFT[0].unCurrencySymbol;
            const stakingManagerTokenName = Buffer.from(this.sysParams.stakingParams.stakingManagerNFT[1].unTokenName).toString('hex');
            const stakingManagerOutputs = tx.outputs.filter(
                (out) =>
                    out.value && stakingManagerCs in out.value && stakingManagerTokenName in out.value[stakingManagerCs]
            );

            if (
                stakingManagerOutputs.length === 1 &&
                collectorInputValue > collectorOutputValue
            ) {
                const amountDistributed =
                    collectorInputValue - collectorOutputValue;

                console.log('Distributed ADA to stakers: ', amountDistributed);
                await this.database.insertDistributionEvent({
                    slot: slot,
                    ada_distributed: amountDistributed,
                });
            }
        }
    }

    /**
     * On rollback: Clean up transactions.
     */
    onRollback(blockHash: string, slot: number): Promise<any> {
        return Promise.all([
            this.database.deleteCollectorBySlot(slot),
            this.database.unmarkConsumedCollectorBySlot(slot),
            this.database.deleteDistributionEventBySlot(slot),
        ]);
    }
}
