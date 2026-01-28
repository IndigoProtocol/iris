import { BlockPraos, Transaction, TransactionOutputReference, Slot } from '@cardano-ogmios/schema';
import CBOR from 'cbor';
import { BaseIndexer } from '../BaseIndexer';
import CONFIG from '../../config';
import { stringify } from '../../../../utils';

type LiquidityPositionDatum = {
    owner: string;
};

type LiquidityPosition = {
    owner: string;
    value: string;
};

/**
 * This Indexer updates the database with liquidity positions.
 */
export class LiquidityPositionIndexer extends BaseIndexer {
    private liquidityAddr = '';

    /**
     * On Block: Search for any outputs with the oracle UTxO
     */
    onBlock(block: BlockPraos): Promise<any> {
        if (block.transactions) {
            const b = block;
            const slot = block.slot;
            // TODO: Fetch all LP Inputs
            return this.database
                .getLiquidityPositionInputs()
                .then((inputs: [string, number][]) => {
                    return Promise.all(
                        b.transactions?.map((tx) =>
                            this.processTransaction(inputs, tx, slot)
                        ) ?? []
                    );
                });
        }
        return Promise.resolve();
    }

    /**
     * Looks for an output with an iAssetToken to process for asset_histories.
     */
    async processTransaction(
        inputs: [string, number][],
        tx: Transaction,
        slot: Slot
    ) {
        // Check if the LP Inputs exist in this transaction. If so, mark as consumed.
        const lpInputs = tx.inputs
            .filter((txIn: TransactionOutputReference) => {
                for (const key in inputs) {
                    if (
                        txIn.transaction.id === inputs[key][0] &&
                        txIn.index === inputs[key][1]
                    )
                        return true;
                }
                return false;
            })
            .map((txIn: TransactionOutputReference) => [txIn.transaction.id, txIn.index] as [string, number]);

        if (lpInputs.length > 0) {
            await this.database.markLiquidityPositionInputsAsConsumed(
                slot,
                lpInputs
            );
        }

        // Traverse all the outputs for any going to the LiquidityPosition contract.
        for (const key in tx.outputs) {
            const output = tx.outputs[key];
            if (
                output.address === this.liquidityAddr &&
                output.datum &&
                typeof output.datum === 'string'
            ) {
                const liquidityPositionDatum = this.toLiquidityPositionDatum(
                    output.datum
                );
                let value: {
                    [k: string]: bigint;
                } = {
                    lovelace: output.value.ada.lovelace,
                };
                if (output.value) {
                    value = Object.assign(value, output.value);
                }
                console.log([lpInputs, tx.inputs, inputs]);

                await this.database.insertLiquidityPosition({
                    slot: slot,
                    output_hash: tx.id,
                    output_index: Number(key),
                    owner: liquidityPositionDatum.owner,
                    value: stringify(value),
                    utxo: stringify(tx),
                });
            }
        }
    }

    private toLiquidityPositionDatum(datum: string): LiquidityPositionDatum {
        const lpDatum = CBOR.decode(Buffer.from(datum, 'hex')).value;
        return {
            owner: lpDatum[0].toString('hex'),
        };
    }

    /**
     * On rollback:
     * 1. Delete all UTxOs where slot > slot.
     * 2. Update all UTxOs where consumed > slot, setting consumed = null.
     */
    onRollback(blockHash: string, slot: number): Promise<any> {
        return Promise.all([
            this.database.deleteLiquidityPositionBySlot(slot),
            this.database.unmarkConsumedLiquidityPositionBySlot(slot),
        ]);
    }
}
