import { BlockPraos, Transaction, Slot } from '@cardano-ogmios/schema';
import { toStakingPosition } from '../../helpers';
import { StakingPositionRow } from '../../models/StakingPosition';
import { BaseV2v1Indexer } from './BaseV2v1Indexer';
import config from '../../config';
import { getStakingAddress } from '../../models/SystemParamsV2v1';


/**
 * This Indexer indexes Staking Positions.
 */
export class StakingPositionV2v1Indexer extends BaseV2v1Indexer {
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
     * TODO
     */
    async processTransaction(tx: Transaction, slot: Slot) {
        const stakingTokenCs = this.sysParams.stakingParams.stakingToken[0].unCurrencySymbol;
        const stakingTokenTokenName = Buffer.from(this.sysParams.stakingParams.stakingToken[1].unTokenName).toString('hex'); 
        const indyTokenCs = this.sysParams.stakingParams.indyToken[0].unCurrencySymbol;
        const indyTokenTokenName = Buffer.from(this.sysParams.stakingParams.indyToken[1].unTokenName).toString('hex');
        const stakingAddress = getStakingAddress(this.sysParams, config.NETWORK_ID);
        // Is the TX burning a CDP tokens?
        if (
            tx.mint &&
            stakingTokenCs in tx.mint &&
            stakingTokenTokenName in tx.mint[stakingTokenCs] &&
            Number(tx.mint[stakingTokenCs][stakingTokenTokenName]) !== 1
        ) {
            const mintAmount = Number(tx.mint[stakingTokenCs][stakingTokenTokenName]);
            if (mintAmount === -1) {
                // Staking Position Closed
                console.log('Staking Position Closed');
                await this.database.markStakingPositionInputsAsConsumed(
                    slot,
                    tx.inputs.map((x) => [x.transaction.id, x.index])
                );
            } else {
                console.error('Unhandled situation - CDP#1');
            }
        } else {
            // We are either opening a Staking Position, voting, unlocking, or adjusting.
            for (const key in tx.outputs) {
                const output = tx.outputs[key];
                const assets = output.value;
                if (
                    assets &&
                    stakingTokenCs in assets &&
                    stakingTokenTokenName in assets[stakingTokenCs] &&
                    output.datum &&
                    typeof output.datum === 'string' &&
                    output.address === stakingAddress
                ) {
                    const mintAmount = tx.mint && tx.mint[stakingTokenCs] && tx.mint[stakingTokenCs][stakingTokenTokenName]
                        ? Number(tx.mint[stakingTokenCs][stakingTokenTokenName])
                        : 0;
                    const spInputs =
                        await this.database.getStakingPositionFromOutput(
                            tx.inputs.map((x) => [x.transaction.id, x.index])
                        );
                    const stakingPosition = toStakingPosition(
                        output.datum
                    );
                    const stakedAmount =
                        output.value[indyTokenCs] && output.value[indyTokenCs][indyTokenTokenName]
                            ? output.value[indyTokenCs][indyTokenTokenName]
                            : BigInt(0);
                    const row = {
                        slot: slot,
                        output_hash: tx.id,
                        output_index: Number(key),
                        owner: stakingPosition.owner,
                        staked_indy: stakedAmount,
                        locked_amount: stakingPosition.locked_amount,
                        snapshot_ada: stakingPosition.snapshot_ada,
                        version: 'v2.1'
                    } as StakingPositionRow;
                    if (spInputs.length === 0 && mintAmount === 1) {
                        console.log(
                            'User is opening a Staking Position',
                            stakingPosition
                        );
                        // We are opening a Staking Position.
                        await this.database.insertStakingPosition(row);
                    } else if (spInputs.length === 1) {
                        console.log(
                            'User is adjusting their Staking Position',
                            stakingPosition
                        );
                        // We are adjusting a Staking Position.
                        // Mark UTxOs as consumed.
                        await this.database.markStakingPositionInputsAsConsumed(
                            slot,
                            tx.inputs.map((x) => [x.transaction.id, x.index])
                        );
                        // Insert new row
                        await this.database.insertStakingPosition(row);
                    } else {
                        console.warn('Staking Position exploit?');
                    }
                }
            }
        }
    }

    /**
     * On rollback:
     * 1. Delete all UTxOs where slot > slot.
     * 2. Update all UTxOs where consumed > slot, setting consumed = null.
     */
    onRollback(blockHash: string, slot: number): Promise<any> {
        return Promise.all([
            this.database.deleteStakingPositionBySlot(slot),
            this.database.unmarkConsumedStakingPositionBySlot(slot),
        ]);
    }
}
