import { BlockPraos, Transaction, Slot } from '@cardano-ogmios/schema';
import { toPubKeyAddress, toPubKeyAddressWithStake, toScriptAddress, toScriptAddressWithStake } from '../../helpers';
import CryptoJS from 'crypto-js';
import CBOR from 'cbor';
import { PollShardDatum } from '../../models/PollShardDatum';
import { BaseV2v1Indexer } from './BaseV2v1Indexer';
import config from '../../config';
import { getPollManagerAddress, getPollShardAddress } from '../../models/SystemParamsV2v1';
import { stringify } from '../../../../utils';

export type TreasuryWithdrawalValue = {
    currency_symbol: string;
    token_name: string; 
    amount: bigint;
}

type PollDatum = {
    poll_id: bigint;
    owner: string;
    type: string;
    content: string;
    tallied_yes: bigint;
    tallied_no: bigint;
    end_time: bigint;
    created_shards: bigint;
    tallied_shards: bigint;
    total_shards: bigint;
    propose_end_time: bigint;
    expiration_time: bigint;
    protocol_version: bigint;
    treasury_withdrawal_address: string | null;
    treasury_withdrawal_value: TreasuryWithdrawalValue[] | null;
};

/**
 * This Indexer indexes polls.
 */
export class PollV2v1Indexer extends BaseV2v1Indexer {
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
        const pollTokenCs = this.sysParams.pollManagerParams.pollToken[0].unCurrencySymbol
        const pollTokenTokenName = Buffer.from(this.sysParams.pollManagerParams.pollToken[1].unTokenName).toString('hex');
        const pollManagerAddress = getPollManagerAddress(this.sysParams, config.NETWORK_ID);
        const pollShardAddress = getPollShardAddress(this.sysParams, config.NETWORK_ID);
        for (const key in tx.outputs) {
            const output = tx.outputs[key];
            const assets = output.value;
            if (
                assets &&
                pollTokenCs in assets &&
                pollTokenTokenName in assets[pollTokenCs] &&
                output.datum &&
                (output.address === pollManagerAddress || output.address === pollShardAddress)
            ) {
                const datum = output.datum;
                const decodedDatum = CBOR.decode(Buffer.from(datum, 'hex'));
                if (decodedDatum.tag === 121) {
                    await this.processPollManager(decodedDatum, tx, key, slot);
                } else if (decodedDatum.tag === 122) {
                    await this.processPollShard(tx, decodedDatum, key, slot);
                } else {
                    console.warn('Poll shards being merged?');
                }
            }
        }

        const mintedAssets = tx.mint;
        if (
            mintedAssets &&
            pollTokenCs in mintedAssets &&
            pollTokenTokenName in mintedAssets[pollTokenCs] &&
            mintedAssets[pollTokenCs][pollTokenTokenName] === BigInt(-1)
        ) {
            let hasPollTokenInOutput = false;
            for (const key in tx.outputs) {
                const output = tx.outputs[key];
                const assets = output.value;
                if (assets && pollTokenCs in assets && pollTokenTokenName in assets[pollTokenCs]) {
                    hasPollTokenInOutput = true;
                    break;
                }
            }

            if (!hasPollTokenInOutput) {
                console.log('Poll has been closed');
                await this.database.markPollHistoryAsClosed(
                    slot,
                    tx.inputs.map((x) => [x.transaction.id, x.index])
                );
            }
        }
    }

    private async processPollManager(
        decodedDatum: any,
        tx: Transaction,
        key: string,
        slot: number
    ) {
        const pollDatum = this.toPollDatum(decodedDatum);
        const hash = CryptoJS.SHA256(tx.id + '#' + key).toString();

        await this.database.insertPollHistory({
            hash: hash,
            slot: slot,
            output_hash: tx.id,
            output_index: Number(key),
            ...pollDatum,
            version: 'v2'
        });
    }

    private async processPollShard(
        tx: Transaction,
        cborDatum: any,
        key: string,
        slot: Slot
    ) {
        const pollTokenCs = this.sysParams.pollManagerParams.pollToken[0].unCurrencySymbol
        const pollTokenTokenName = Buffer.from(this.sysParams.pollManagerParams.pollToken[1].unTokenName).toString('hex');
        const mintAmount = tx.mint
            ? Number(tx.mint[pollTokenCs][pollTokenTokenName])
            : 0;
        const pollShardInputs = await this.database.getPollShardFromOutput(
            tx.inputs.map((x) => [x.transaction.id, x.index])
        );
        const pollShard = this.toPollShardDatum(cborDatum);

        if (pollShardInputs.length === 0 && mintAmount >= 1) {
            console.log('New Poll Shard created', pollShard);
            // We are creating a new Poll Shard.
            await this.database.insertPollShard({
                slot: slot,
                output_hash: tx.id,
                output_index: Number(key),
                poll_id: pollShard.poll_id,
                yes_votes: pollShard.yes_votes,
                no_votes: pollShard.no_votes,
                end_time: pollShard.end_time,
                manager_address: pollShard.manager_address,
                utxo: stringify(tx),
            });
        } else if (pollShardInputs.length === 1) {
            console.log('Consuming a Poll Shard', pollShard);
            // We are adjusting a CDP.
            await this.database.updatePollShard(pollShardInputs[0].id, {
                slot: slot,
                output_hash: tx.id,
                output_index: Number(key),
                poll_id: pollShard.poll_id,
                yes_votes: pollShard.yes_votes,
                no_votes: pollShard.no_votes,
                end_time: pollShard.end_time,
                manager_address: pollShard.manager_address,
                utxo: stringify(tx),
            });
        } else {
            console.log('Poll Shard exploit?');
        }
    }

    toPollDatum(datum: any): PollDatum {
        const poll = datum.value[0].value;
        let treasuryWithdrawalAddress = null;
        let treasuryWithdrawalValue = null;

        if(poll[3].tag === 121) {
            const treasuryWithdrawalDatum = poll[3].value[0].value;

            if(treasuryWithdrawalDatum[0].value[0].tag === 121) {
                const treasuryWithdrawalAddressPub = Buffer.from(treasuryWithdrawalDatum[0].value[0].value[0]).toString('hex');
                const treasuryWithdrawalAddressStake = treasuryWithdrawalDatum[0].value[1].tag === 121 ? 
                    Buffer.from(treasuryWithdrawalDatum[0].value[1].value[0].value[0].value[0]).toString('hex') :
                    undefined;
                
                treasuryWithdrawalAddress = treasuryWithdrawalAddressStake ?
                    toPubKeyAddressWithStake(treasuryWithdrawalAddressPub, treasuryWithdrawalAddressStake, config.NETWORK_ID) :
                    toPubKeyAddress(treasuryWithdrawalAddressPub, config.NETWORK_ID);
            } else if(treasuryWithdrawalDatum[0].value[0].tag === 122) {
                const treasuryWithdrawalAddressPub = Buffer.from(treasuryWithdrawalDatum[0].value[0].value[0]).toString('hex');
                const treasuryWithdrawalAddressStake = treasuryWithdrawalDatum[0].value[1].tag === 121 ? 
                    Buffer.from(treasuryWithdrawalDatum[0].value[1].value[0].value[0].value[0]).toString('hex') :
                    undefined;
                
                treasuryWithdrawalAddress = treasuryWithdrawalAddressStake ?
                    toScriptAddressWithStake(treasuryWithdrawalAddressPub, treasuryWithdrawalAddressStake, config.NETWORK_ID) :
                    toScriptAddress(treasuryWithdrawalAddressPub, config.NETWORK_ID);
            } else {
                throw new Error('Treasury withdrawal address not compatible.');
            }
            
            for (const key in treasuryWithdrawalDatum[1]) {
                const value = treasuryWithdrawalDatum[1][key].value;
                const currencySymbol = value[0].toString('hex');
                const tokenName = value[1].toString('hex');
                const amount = BigInt(value[2]);

                if(!treasuryWithdrawalValue) treasuryWithdrawalValue = [];
                treasuryWithdrawalValue.push({
                    currency_symbol: currencySymbol,
                    token_name: tokenName,
                    amount: amount
                });
            }

        }

        return {
            poll_id: poll[0],
            owner: poll[1].toString('hex'),
            type: this.toProposalContentType(poll[2].tag),
            content: this.toProposalContent(poll[2]),
            tallied_yes: poll[4].value[0],
            tallied_no: poll[4].value[1],
            end_time: poll[5],
            created_shards: poll[6],
            tallied_shards: poll[7],
            total_shards: poll[8],
            propose_end_time: poll[9],
            expiration_time: poll[10],
            protocol_version: poll[11],
            treasury_withdrawal_address: treasuryWithdrawalAddress,
            treasury_withdrawal_value: treasuryWithdrawalValue,
        };
    }

    toPollShardDatum(datum: any): PollShardDatum {
        const poll = datum.value[0].value;

        return {
            poll_id: poll[0],
            yes_votes: poll[1].value[0],
            no_votes: poll[1].value[1],
            end_time: poll[2],
            manager_address: 'TODO',
        };
    }

    toProposalContent(proposalContent: any): string {
        switch (proposalContent.tag) {
            case 121:
                return stringify({
                    assetName: proposalContent.value[0].toString('hex'),
                    oracleNft: [
                        proposalContent.value[1].value[0].value[0].toString(
                            'hex'
                        ),
                        proposalContent.value[1].value[0].value[1].toString(
                            'hex'
                        ),
                    ],
                    interestNft: [
                        proposalContent.value[2].value[0].toString(
                            'hex'
                        ),
                        proposalContent.value[2].value[1].toString(
                            'hex'
                        ),
                    ],
                    redemption_ratio_percentage: proposalContent.value[3].value[0],
                    maintenace_ratio_percentage: proposalContent.value[4].value[0],
                    liquidation_ratio_percentage: proposalContent.value[5].value[0],
                    debt_minting_fee_percentage: proposalContent.value[6].value[0],
                    liquidation_processing_fee_percentage: proposalContent.value[7].value[0],
                    stability_pool_withdrawal_fee_percentage: proposalContent.value[8].value[0],
                    redemption_reimbursement_percentage: proposalContent.value[9].value[0],
                    redemption_processing_fee_percentage: proposalContent.value[10].value[0],
                    interest_collector_portion_percentage: proposalContent.value[11].value[0],
                });
            case 122:
                console.log(proposalContent.value[2]);
                return stringify({
                    assetName: proposalContent.value[0].toString('hex'),
                    oracleNft:
                        proposalContent.value[1].tag === 122
                            ? [
                                  proposalContent.value[1].value[0].value[0].value[0].toString(
                                      'hex'
                                  ),
                                  proposalContent.value[1].value[0].value[0].value[1].toString(
                                      'hex'
                                  ),
                              ]
                            : proposalContent.value[1].value,
                    interestNft: [
                        proposalContent.value[2].value[0].toString(
                            'hex'
                        ),
                        proposalContent.value[2].value[1].toString(
                            'hex'
                        ),
                    ],
                    redemption_ratio_percentage: proposalContent.value[3].value[0],
                    maintenace_ratio_percentage: proposalContent.value[4].value[0],
                    liquidation_ratio_percentage: proposalContent.value[5].value[0],
                    debt_minting_fee_percentage: proposalContent.value[6].value[0],
                    liquidation_processing_fee_percentage: proposalContent.value[7].value[0],
                    stability_pool_withdrawal_fee_percentage: proposalContent.value[8].value[0],
                    redemption_reimbursement_percentage: proposalContent.value[9].value[0],
                    redemption_processing_fee_percentage: proposalContent.value[10].value[0],
                    interest_collector_portion_percentage: proposalContent.value[11].value[0],
                });
            case 125:
                return stringify(proposalContent.value[0].toString());
            default:
                return stringify(proposalContent.value);
        }
    }

    toProposalContentType(type: number): string {
        switch (type) {
            case 121:
                return 'PROPOSE_ASSET';
            case 122:
                return 'MIGRATE_ASSET';
            case 123:
                return 'MODIFY_PROTOCOL_PARAMETERS';
            case 124:
                return 'UPGRADE_PROTOCOL';
            case 125:
                return 'TEXT';
            default:
                throw new Error('Proposal type not found.');
        }
    }

    /**
     * TODO:
     * On rollback:
     * 1. Delete all UTxOs where slot > slot.
     */
    onRollback(blockHash: string, slot: number): Promise<any> {
        return this.database.deletePollHistoryBySlot(slot);
    }
}
