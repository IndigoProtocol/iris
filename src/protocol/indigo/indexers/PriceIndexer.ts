import { BlockPraos, Transaction, Slot } from '@cardano-ogmios/schema';
import CBOR from 'cbor';
import OracleRow from '../models/OracleRow';
import { BaseIndexer } from './BaseIndexer';
import CryptoJS from 'crypto-js';

type OracleDatum = {
    price: bigint;
    expiration: bigint;
};

/**
 * This Indexer updates the database with price history.
 */
export class PriceIndexer extends BaseIndexer {
    /**
     * On Block: Search for any outputs with the oracle UTxO
     */
    onBlock(block: BlockPraos): Promise<any> {
        if (block.transactions) {
            const b = block;
            const slot = block.slot;
            return this.database.getIAssetOracles().then((oracleTokens) => {
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
        oracleRows: OracleRow[],
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
                        oracle.oracle_nft_cs in assets &&
                        oracle.oracle_nft_tn in assets[oracle.oracle_nft_cs] &&
                        output.datum &&
                        typeof output.datum === 'string'
                    ) {
                        console.log(
                            'Found oracle price for ' + oracle.asset
                        );
                        const datum = this.toOracleDatum(
                            output.datum
                        );
                        const hash = CryptoJS.SHA256(
                            tx.id + '#' + key + '.' + oracle.asset
                        ).toString();
                        await this.database.insertPrice({
                            hash: hash,
                            slot: slot,
                            output_hash: tx.id,
                            output_index: Number(key),
                            asset: oracle.asset,
                            price: Number(datum.price),
                            expiration: Number(datum.expiration),
                            address: output.address,
                        });
                    }
                }
            }
        }
    }

    toOracleDatum(datum: string): OracleDatum {
        const oracleDatum = CBOR.decode(Buffer.from(datum, 'hex')).value;
        return {
            price: oracleDatum[0].value[0],
            expiration: oracleDatum[1],
        };
    }

    /**
     * On rollback: Clean up transactions.
     */
    onRollback(blockHash: string, slot: number): Promise<any> {
        return this.database.deletePriceBySlot(slot);
    }
}
