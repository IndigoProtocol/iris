import { BlockPraos, Transaction, Slot } from '@cardano-ogmios/schema';
import CBOR from 'cbor';
import { AssetClass } from '../../models/SystemParamsV1';
import CryptoJS from 'crypto-js';
import { BaseV1Indexer } from './BaseV1Indexer';
import config from '../../config';

type iAsset = {
    iaName: string;
    iaMinRatio: number;
    iaPrice: AssetClass | number;
};

/**
 * This Indexer indexes iAssets.
 */
export class AssetHistoryV1Indexer extends BaseV1Indexer {
    /*
     * For each transaction look for the following events:
     * 1. An iAsset has been output. If so, add that output to asset histories table.
     */
    onBlock(block: BlockPraos): Promise<any> {
        if (block.transactions) {
            const slot = block.slot;
            return Promise.all(
                block.transactions.map((tx) => this.processTransaction(tx, slot))
            );
        }
        return Promise.resolve();
    }

    /**
     * Looks for an output with an iAssetToken to process for asset_histories.
     */
    async processTransaction(tx: Transaction, slot: Slot) {
        const iAssetTokenCs = this.sysParams.cdpParams.iAssetAuthToken[0].unCurrencySymbol;
        const iAssetTokenTokenName = Buffer.from(this.sysParams.cdpParams.iAssetAuthToken[1].unTokenName).toString('hex');

        for (const key in tx.outputs) {
            const output = tx.outputs[key];
            const assets = output.value;
            if (
                assets &&
                iAssetTokenCs in assets &&
                iAssetTokenTokenName in assets[iAssetTokenCs] &&
                output.datum &&
                typeof output.datum === 'string' &&
                output.address == config.V1_CDP_ADDRESS
            ) {
                const iasset = this.toIAssetFromDatum(output.datum);
                const hash = CryptoJS.SHA256(tx.id + '#' + key).toString();

                await this.database.insertAssetHistory({
                    hash: hash,
                    slot: slot,
                    output_hash: tx.id,
                    output_index: Number(key),
                    asset: iasset.iaName,
                    mcr: iasset.iaMinRatio,
                    oracle_nft_cs:
                        typeof iasset.iaPrice === 'object'
                            ? iasset.iaPrice[0].unCurrencySymbol
                            : undefined,
                    oracle_nft_tn:
                        typeof iasset.iaPrice === 'object'
                            ? iasset.iaPrice[1].unTokenName
                            : undefined,
                    delist_price:
                        typeof iasset.iaPrice === 'number'
                            ? iasset.iaPrice
                            : undefined,
                    version: 'v1'
                });
            }
        }
    }

    private toIAssetFromDatum(datum: string): iAsset {
        const iAssetDatum = CBOR.decode(Buffer.from(datum, 'hex')).value[0]
            .value;
        return {
            iaName: iAssetDatum[0].toString(),
            iaMinRatio: iAssetDatum[1].value[0] / 10 ** 6,
            iaPrice:
                iAssetDatum[2].tag === 122
                    ? [
                          {
                              unCurrencySymbol: Buffer.from(
                                  iAssetDatum[2].value[0].value[0].value[0]
                              ).toString('hex'),
                          },
                          {
                              unTokenName: Buffer.from(
                                  iAssetDatum[2].value[0].value[0].value[1]
                              ).toString('hex'),
                          },
                      ]
                    : iAssetDatum[2].value[0],
        };
    }

    /**
     * On rollback:
     * 1. Delete all UTxOs where slot > slot.
     */
    onRollback(blockHash: string, slot: number): Promise<any> {
        return this.database.deleteAssetHistoryBySlot(slot);
    }
}
