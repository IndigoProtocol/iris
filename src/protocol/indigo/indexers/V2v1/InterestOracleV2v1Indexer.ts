import { BlockPraos, Transaction, Slot } from '@cardano-ogmios/schema';
import CBOR from 'cbor';
import InterestOracleRow from '../../models/InterestOracleRow';
import { BaseIndexer } from '../BaseIndexer';

type InterestOracleDatum = {
    unitary_interest: bigint;
    interest_rate: bigint;
    last_interest_update: bigint;
};

/**
 * This Indexer updates the database with price history.
 */
export class InterestOracleV2v1Indexer extends BaseIndexer {
    /**
     * On Block: Search for any outputs with the oracle UTxO
     */
    onBlock(block: BlockPraos): Promise<any> {
        if (block.transactions) {
            const b = block;
            const slot = block.slot;
            return this.database.getIAssetInterestOracles().then((oracleTokens) => {
                return Promise.all(
                    b.transactions?.map((tx) =>
                        this.processTransaction(oracleTokens, tx, slot)
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
        oracleRows: InterestOracleRow[],
        tx: Transaction,
        slot: Slot
    ) {
        for (const oracleKey in oracleRows) {
            if (Object.prototype.hasOwnProperty.call(oracleRows, oracleKey)) {
                const oracle = oracleRows[oracleKey];
                for (const key in tx.outputs) {
                    const output = tx.outputs[key];
                    const assets = output.value;
                    if (
                        assets &&
                        oracle.interest_oracle_nft_cs in assets &&
                        oracle.interest_oracle_nft_tn in assets[oracle.interest_oracle_nft_cs] &&
                        output.datum &&
                        typeof output.datum === 'string'
                    ) {
                        console.log('Found interest oracle for ' + oracle.asset);
                        const datum = this.toInterestOracleDatum(
                            output.datum
                        );
                        console.log(datum)
                        await this.database.insertAssetInterestRate({
                            slot: slot,
                            output_hash: tx.id,
                            output_index: Number(key),
                            asset: oracle.asset,
                            unitary_interest: datum.unitary_interest,
                            interest_rate: datum.interest_rate,
                            last_interest_update: datum.last_interest_update,
                            address: output.address,
                        });
                    }
                }
            }
        }
    }

    toInterestOracleDatum(datum: string): InterestOracleDatum {
        const interestOracleDatum = CBOR.decode(Buffer.from(datum, 'hex')).value;
        return {
            unitary_interest: interestOracleDatum[0],
            interest_rate: interestOracleDatum[1].value[0],
            last_interest_update: interestOracleDatum[2],
        };
    }

    /**
     * On rollback: Clean up transactions.
     */
    onRollback(blockHash: string, slot: number): Promise<any> {
        return this.database.deletePriceBySlot(slot);
    }
}
