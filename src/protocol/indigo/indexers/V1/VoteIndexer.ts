import { BlockPraos, Transaction, Slot, TransactionOutput, Redeemer } from "@cardano-ogmios/schema";
import { assetClassToString, toStakingPosition } from "../../helpers";
import CBOR from "cbor";
import { PollShardDatum } from "../../models/PollShardDatum";
import { BaseV1Indexer } from "./BaseV1Indexer";
import config from "../../config";

enum VoteOption {
    Yes = 'yes', 
    No = 'no'
}

/**
 * This Indexer indexes individual user votes.
 */
export class VoteIndexer extends BaseV1Indexer {
    onBlock(block: BlockPraos): Promise<any> {
        if (block.transactions) {
            const slot = block.slot;
            return Promise.all(
                block.transactions.map(tx => this.processTransaction(tx, slot))
            )
        }
        return Promise.resolve();
    }
    
    async processTransaction(tx: Transaction, slot: Slot) {
        const indyTokenCs = this.sysParams.stakingParams.indyToken[0].unCurrencySymbol;
        const indyTokenTokenName = Buffer.from(this.sysParams.stakingParams.indyToken[1].unTokenName).toString ('hex');
        const pollShardOutput = this.getPollShardOutput(tx);
        const stakingPositionOutput = this.getStakingPositionOutput(tx);
        if (pollShardOutput && stakingPositionOutput && typeof stakingPositionOutput.datum === 'string' && typeof pollShardOutput.datum === 'string') {
            const voteRedeemer = this.getVoteRedeemer(tx);
            const lockRedeemer = this.hasLockRedeemer(tx);

            if (voteRedeemer !== undefined && lockRedeemer) {
                const pollShardDatum = this.toPollShardDatum(pollShardOutput.datum);
                const stakingPositionDatum = toStakingPosition(stakingPositionOutput.datum);
                const stakedAmount = stakingPositionOutput.value && stakingPositionOutput.value[indyTokenCs] && stakingPositionOutput.value[indyTokenCs][indyTokenTokenName] ? 
                    stakingPositionOutput.value[indyTokenCs][indyTokenTokenName] : 
                    BigInt(0);

                await this.database.insertVote({
                    slot: slot,
                    output_hash: tx.id,
                    owner: stakingPositionDatum.owner,
                    poll_id: pollShardDatum.poll_id,
                    poll_end_time: pollShardDatum.end_time,
                    vote_amount: stakedAmount,
                    vote_option: voteRedeemer
                })
            }
        }
    }

    private getPollShardOutput(tx: Transaction): TransactionOutput | undefined {
        const pollTokenCs = this.sysParams.pollManagerParams.pollToken[0].unCurrencySymbol;
        const pollTokenTokenName = Buffer.from(this.sysParams.pollManagerParams.pollToken[1].unTokenName).toString('hex');

        return tx.outputs.find(
            (out: TransactionOutput) => 
                pollTokenCs in out.value && 
                pollTokenTokenName in out.value[pollTokenCs] && 
                out.datum && typeof out.datum === 'string' && 
                out.address === config.V1_POLL_SHARD_ADDRESS
        );
    }

    private getStakingPositionOutput(tx: Transaction): TransactionOutput | undefined {
        const stakingTokenCs = this.sysParams.stakingParams.stakingToken[0].unCurrencySymbol;
        const stakingTokenTokenName = Buffer.from(this.sysParams.stakingParams.stakingToken[1].unTokenName).toString('hex');

        return tx.outputs.find(
            (out: TransactionOutput) => 
                stakingTokenCs in out.value && 
                stakingTokenTokenName in out.value[stakingTokenCs] && 
                out.datum && 
                typeof out.datum === 'string' && 
                out.address === config.V1_STABILITY_POOL_ADDRESS
        );
    }

    private getVoteRedeemer(tx: Transaction): VoteOption | undefined {
        if (tx.redeemers) {
            for (const redeemerKey in tx.redeemers) {
                const redeemer = tx.redeemers[redeemerKey];
                const redeemerCbor = CBOR.decode(Buffer.from(redeemer.redeemer, 'hex'));

                if (redeemerCbor.tag === 121 && redeemerCbor.value.length === 1 && redeemerCbor.value[0].tag) {
                    if (redeemerCbor.value[0].tag === 121) return VoteOption.Yes;
                    if (redeemerCbor.value[0].tag === 122) return VoteOption.No;
                }
            }
        }
        return undefined;
    }

    private hasLockRedeemer(tx: Transaction): boolean {
        if (tx.redeemers) {
            for (const redeemerKey in tx.redeemers) {
                const redeemer = tx.redeemers[redeemerKey];
                const redeemerCbor = CBOR.decode(Buffer.from(redeemer.redeemer, 'hex'));
                
                if (redeemerCbor.tag === 126) return true;
            }
        }
        return false;
    }

    toPollShardDatum(datum: string): PollShardDatum {
        const poll = CBOR.decode(Buffer.from(datum, 'hex')).value;
        
        return {
            poll_id: poll[0],
            yes_votes: poll[1].value[0],
            no_votes: poll[1].value[1],
            end_time: poll[2],
            manager_address: 'TODO'
        };
    }

    onRollback(blockHash: string, slot: number): Promise<any> {
        return this.database.deleteVoteBySlot(slot);
    }
}
