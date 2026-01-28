import { BlockPraos, Transaction, Slot } from '@cardano-ogmios/schema';
import { assetClassToString } from '../../helpers';
import CryptoJS from 'crypto-js';
import CBOR from 'cbor';
import { BaseV2Indexer } from './BaseV2Indexer';
import config from '../../config';
import { getStakingAddress } from '../../models/SystemParamsV2';

type StakingManagerDatum = {
    totalStake: bigint;
    snapshotAda: bigint;
};

/**
 * This Indexer indexes StakingManager.
 */
export class StakingManagerV2Indexer extends BaseV2Indexer {
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
        const stakingManagerTokenCs = this.sysParams.stakingParams.stakingManagerNFT[0].unCurrencySymbol;
        const stakingManagerTokenTokenName = Buffer.from(this.sysParams.stakingParams.stakingManagerNFT[1].unTokenName).toString('hex');
        const stakingAddress = getStakingAddress(this.sysParams, config.NETWORK_ID);
        for (const key in tx.outputs) {
            const output = tx.outputs[key];
            const assets = output.value;
            if (
                assets &&
                stakingManagerTokenCs in assets &&
                stakingManagerTokenTokenName in assets[stakingManagerTokenCs] &&
                output.datum &&
                typeof output.datum === 'string' &&
                output.address === stakingAddress
            ) {
                const datum = output.datum;
                const stakingManager = this.toStakingManager(datum);
                const hash = CryptoJS.SHA256(tx.id + '#' + key).toString();
                console.log(
                    slot,
                    'Found Staking Manager -',
                    stakingManager,
                    tx.id,
                    Number(key),
                    hash
                );
                await this.database.insertStakingManagerHistory({
                    hash: hash,
                    slot: slot,
                    tx_block_index: ix,
                    output_hash: tx.id,
                    output_index: Number(key),
                    total_stake: stakingManager.totalStake,
                    snapshot_ada: stakingManager.snapshotAda,
                    version: 'v2'
                });
            }
        }
    }

    private toStakingManager(datum: string): StakingManagerDatum {
        const stakingManagerDatum = CBOR.decode(
            Buffer.from(datum, 'hex')
        ).value[0];
        return {
            totalStake: stakingManagerDatum.value[0],
            snapshotAda: stakingManagerDatum.value[1].value[0],
        };
    }

    /**
     * TODO:
     * On rollback:
     * 1. Delete all UTxOs where slot > slot.
     */
    onRollback(blockHash: string, slot: number): Promise<any> {
        return this.database.deleteStakingManagerHistoryBySlot(slot);
    }
}
