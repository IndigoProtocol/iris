import { BlockPraos, Transaction, Slot } from '@cardano-ogmios/schema';
import { assetClassToString } from '../../helpers';
import CryptoJS from 'crypto-js';
import { StabilityPoolSnapshot } from '../../models/StabilityPoolSnapshot';
import CBOR from 'cbor';
import { BaseV1Indexer } from './BaseV1Indexer';
import config from '../../config';
import { stringify } from '../../../../utils';

/**
 * This Indexer indexes Stability Pools.
 */
export class StabilityPoolIndexer extends BaseV1Indexer {
    /*
     * For each transaction look for the following events:
     * 1. An iAsset has been output. If so, add that output to asset histories table.
     */
    onBlock(block: BlockPraos): Promise<any> {
        if (block.transactions) {
            const slot = block.slot;
            return Promise.all(
                block.transactions.map((tx, ix) => this.processTransaction(tx, slot, ix))
            );
        }
        return Promise.resolve();
    }

    /**
     * Looks for an output with an iAssetToken to process for asset_histories.
     */
    async processTransaction(tx: Transaction, slot: Slot, ix: number) {
        const stabilityPoolToken = assetClassToString(
            this.sysParams.stabilityPoolParams.stabilityPoolToken
        );
        const stabilityPoolTokenCs = this.sysParams.stabilityPoolParams.stabilityPoolToken[0].unCurrencySymbol;
        const stabilityPoolTokenTokenName = Buffer.from(this.sysParams.stabilityPoolParams.stabilityPoolToken[1].unTokenName).toString('hex');
        for (const key in tx.outputs) {
            const output = tx.outputs[key];
            const assets = output.value;
            if (
                assets &&
                stabilityPoolTokenCs in assets &&
                stabilityPoolTokenTokenName in assets[stabilityPoolTokenCs] &&
                output.datum &&
                typeof output.datum === 'string' &&
                output.address === config.V1_STABILITY_POOL_ADDRESS
            ) {
                const datum = output.datum;
                const datumDeconst = CBOR.decode(Buffer.from(datum, 'hex'));
                const spDatum = datumDeconst.value;
                const spIAsset = spDatum[0].toString();
                const spSnapshot = this.toStabilityPoolSnapshot(
                    spDatum[1].value
                );
                const epochToScaleToSum = spDatum[2];
                const hash = CryptoJS.SHA256(tx.id + '#' + key).toString();
                console.log(
                    slot,
                    'Found StabilityPool -',
                    datum,
                    spIAsset,
                    spDatum[1].value,
                    stringify(spSnapshot),
                    epochToScaleToSum,
                    tx.id,
                    Number(key),
                    hash
                );

                const ess = new Map<[bigint, bigint], bigint>();
                if ('forEach' in epochToScaleToSum) {
                    epochToScaleToSum.forEach((value: any, key: any) => {
                        ess.set(key.value, value.value[0]);
                    });
                }

                await this.database.insertStabilityPoolHistory({
                    hash: hash,
                    slot: slot,
                    tx_block_index: ix,
                    output_hash: tx.id,
                    output_index: Number(key),
                    asset: spIAsset,
                    snapshot: spSnapshot,
                    epochToScaleToSum: stringify(Object.fromEntries(ess)),
                    version: 'v1'
                });
            }
        }
    }

    toStabilityPoolSnapshot(element: any[]): StabilityPoolSnapshot {
        return {
            snapshotP: element[0].value[0],
            snapshotD: element[1].value[0],
            snapshotS: element[2].value[0],
            snapshotEpoch: element[3],
            snapshotScale: element[4],
        };
    }

    /**
     * On rollback:
     * 1. Delete all UTxOs where slot > slot.
     */
    onRollback(blockHash: string, slot: number): Promise<any> {
        return this.database.deleteStabilityPoolHistoryBySlot(slot);
    }
}
