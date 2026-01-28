import { BlockPraos, Transaction, Slot, TransactionOutput } from '@cardano-ogmios/schema';
import { toStakingPosition } from '../../helpers';
import { StakingPositionRow } from '../../models/StakingPosition';
import { BaseV2v1Indexer } from './BaseV2v1Indexer';
import config from '../../config';
import { getStakingAddress } from '../../models/SystemParamsV2v1';


/**
 * This Indexer indexes Staking Positions.
 */
export class StakingPositionRecordV2v1Indexer extends BaseV2v1Indexer {
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

    async processTransaction(tx: Transaction, slot: Slot) {

        // Setup
        const stakingTokenCs = this.sysParams.stakingParams.stakingToken[0].unCurrencySymbol;
        const stakingTokenTokenName = Buffer.from(this.sysParams.stakingParams.stakingToken[1].unTokenName).toString('hex'); 

        const inputsMapped = tx.inputs.map((x) => [x.transaction.id, x.index]) as [
            string,
            number
        ][];

        let stakingPositionTokenMintAmount = 0;

        if (
            tx.mint &&
            stakingTokenCs in tx.mint &&
            stakingTokenTokenName in tx.mint[stakingTokenCs]
        ) {
            stakingPositionTokenMintAmount = Number(tx.mint[stakingTokenCs][stakingTokenTokenName]);
        }

        if (stakingPositionTokenMintAmount === 1) {
            const [output, index] = this.findStakingPositionOutput(tx);
            if (output && output.datum) {
                // Staking Position Opened
                const stakedAmount = this.findStakedAmount(output);
                const stakingPosition = toStakingPosition(output.datum);

                const referral = this.findReferral(tx);

                // Create record
                const stakingPositionRecordId = await this.database.createStakingPositionRecord(stakingPosition.owner, tx.id, index, stakedAmount, slot, referral);
                await this.database.createStakingPositionRecordHistory(stakingPositionRecordId, tx.id, index, 'open', slot, stakedAmount, referral);
            }
        } else if (stakingPositionTokenMintAmount === -1) {
            const stakingPositionRecord = await this.database.getStakingPositionRecord(inputsMapped);
            if (!stakingPositionRecord) {
                return;
            }

            await this.database.closeStakingPositionRecord(stakingPositionRecord, slot);
        } else {
            const [output, index] = this.findStakingPositionOutput(tx);
            if (output && output.datum) {
                // Staking Position Adjusted
                const stakedAmount = this.findStakedAmount(output);
                const referral = this.findReferral(tx);

                const stakingPositionRecord = await this.database.getStakingPositionRecord(inputsMapped);
                if (!stakingPositionRecord) {
                    return;
                }

                await this.database.createStakingPositionRecordHistory(stakingPositionRecord, tx.id, index, 'adjust', slot, stakedAmount, referral);
                await this.database.updateStakingPositionRecord(stakingPositionRecord, stakedAmount, tx.id, index, referral);
            }
        }
    }

    findReferral(tx: Transaction): string | null {
        const metadata = tx.metadata;
        if (!metadata) {
            return null;
        }

        const referral = metadata.labels['999'];
        if (!referral) {
            return null;
        }

        if (typeof referral.json === 'string') {
            if (referral.json.length > 0) { 
                return referral.json;
            }
        }

        return null;
    }

    findStakedAmount(output: TransactionOutput) {
        const indyTokenCs = this.sysParams.stakingParams.indyToken[0].unCurrencySymbol;
        const indyTokenTokenName = Buffer.from(this.sysParams.stakingParams.indyToken[1].unTokenName).toString('hex');
        return output.value && output.value[indyTokenCs] && output.value[indyTokenCs][indyTokenTokenName]
            ? output.value[indyTokenCs][indyTokenTokenName]
            : 0n;
    }

    findStakingPositionOutput(tx: Transaction): [TransactionOutput, number] | [null, -1] {
        const stakingTokenCs = this.sysParams.stakingParams.stakingToken[0].unCurrencySymbol;
        const stakingTokenTokenName = Buffer.from(this.sysParams.stakingParams.stakingToken[1].unTokenName).toString('hex'); 
        const stakingAddress = getStakingAddress(this.sysParams, config.NETWORK_ID);

        const index = tx.outputs.findIndex((output) => 
            output.value &&
                stakingTokenCs in output.value &&
                stakingTokenTokenName in output.value[stakingTokenCs] &&
                output.value[stakingTokenCs][stakingTokenTokenName] === 1n &&
                output.datum &&
                typeof output.datum === 'string' &&
                output.address === stakingAddress
        );
        if (index === -1) {
            return [null, -1];
        }
        return [tx.outputs[index], index];
    }
    /**
     * On rollback:
     * 1. Delete all UTxOs where slot > slot.
     * 2. Update all UTxOs where consumed > slot, setting consumed = null.
     */
    onRollback(blockHash: string, slot: number): Promise<any> {
        return Promise.resolve();
    }
}
