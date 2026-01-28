import { BlockPraos, Transaction, Slot } from '@cardano-ogmios/schema';
import { assetClassToString } from '../../helpers';
import CryptoJS from 'crypto-js';
import CBOR from 'cbor';
import { BaseV1Indexer } from './BaseV1Indexer';
import config from '../../config';

type ProtocolParametersDatum = {
    proposalDeposit: bigint;
    votingPeriod: bigint;
    effectiveDelay: bigint;
    expirationPeriod: bigint;
    protocolFeePercentage: bigint;
    proposingPeriod: bigint;
    totalShards: bigint;
};

/**
 * This Indexer indexes Protocol Parameters.
 */
export class ProtocolParameterIndexer extends BaseV1Indexer {
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
        const govNFTCs = this.sysParams.govParams.govNFT[0].unCurrencySymbol;
        const govNFTTokenName = Buffer.from(this.sysParams.govParams.govNFT[1].unTokenName).toString('hex');
        for (const key in tx.outputs) {
            const output = tx.outputs[key];
            const assets = output.value;
            if (
                assets &&
                govNFTCs in assets &&
                govNFTTokenName in assets[govNFTCs] &&
                output.datum &&
                typeof output.datum === 'string' &&
                output.address === config.V1_GOV_ADDRESS
            ) {
                const datum = output.datum;
                const pp = this.toProtocolParameters(datum);
                const hash = CryptoJS.SHA256(tx.id + '#' + key).toString();
                console.log(
                    slot,
                    'Found Protocol parameters -',
                    pp,
                    tx.id,
                    Number(key),
                    hash
                );

                await this.database.insertProtocolParameterHistory({
                    hash: hash,
                    slot: slot,
                    output_hash: tx.id,
                    output_index: Number(key),
                    proposal_deposit: pp.proposalDeposit,
                    voting_period: pp.votingPeriod,
                    effective_delay: pp.effectiveDelay,
                    expiration_period: pp.expirationPeriod,
                    protocol_fee_percentage: pp.protocolFeePercentage,
                    proposing_period: pp.proposingPeriod,
                    total_shards: pp.totalShards,
                    version: 'v1'
                });
            }
        }
    }

    private toProtocolParameters(datum: string): ProtocolParametersDatum {
        const govDatum = CBOR.decode(Buffer.from(datum, 'hex')).value;
        const protocolParameters = govDatum[1].value;
        return {
            proposalDeposit: protocolParameters[0],
            votingPeriod: protocolParameters[1],
            effectiveDelay: protocolParameters[2],
            expirationPeriod: protocolParameters[3],
            protocolFeePercentage: protocolParameters[4].value[0],
            proposingPeriod: protocolParameters[5],
            totalShards: protocolParameters[6],
        };
    }

    /**
     * TODO:
     * On rollback:
     * 1. Delete all UTxOs where slot > slot.
     */
    onRollback(blockHash: string, slot: number): Promise<any> {
        return this.database.deleteProtocolParameterHistoryBySlot(slot);
    }
}
