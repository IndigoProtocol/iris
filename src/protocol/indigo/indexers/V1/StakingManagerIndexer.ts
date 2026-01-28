import { BlockPraos, Transaction, Slot } from '@cardano-ogmios/schema';
import { assetClassToString } from '../../helpers';
import CryptoJS from 'crypto-js';
import CBOR from 'cbor';
import { BaseV1Indexer } from './BaseV1Indexer';
import config from '../../config';

type StakingManagerDatum = {
    totalStake: bigint;
    snapshotAda: bigint;
};

/**
 * This Indexer indexes StakingManager.
 */
export class StakingManagerIndexer extends BaseV1Indexer {
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
        for (const key in tx.outputs) {
            const output = tx.outputs[key];
            const assets = output.value;
            if (
                assets &&
                stakingManagerTokenCs in assets &&
                stakingManagerTokenTokenName in assets[stakingManagerTokenCs] &&
                output.datum &&
                typeof output.datum === 'string' &&
                output.address === config.V1_STAKING_ADDRESS
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
                    version: 'v1'
                });
            }
        }
    }

    private toStakingManager(datum: string): StakingManagerDatum {
        const stakingManagerDatum = CBOR.decode(
            Buffer.from(datum, 'hex')
        ).value;
        console.log(stakingManagerDatum[1].value[0].value[0]);
        return {
            totalStake: stakingManagerDatum[0],
            snapshotAda: stakingManagerDatum[1].value[0].value[0],
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
