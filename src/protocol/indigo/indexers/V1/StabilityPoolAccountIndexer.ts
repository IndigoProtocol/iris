import { BlockPraos, Transaction, Slot } from '@cardano-ogmios/schema';
import { assetClassToString } from '../../helpers';
import { StabilityPoolSnapshot } from '../../models/StabilityPoolSnapshot';
import CBOR from 'cbor';
import { StabilityPoolAccountRow } from '../../models/StabilityPoolAccount';
import { BaseV1Indexer } from './BaseV1Indexer';
import config from '../../config';

type StabilityPoolAccountDatum = {
    asset: string;
    owner: string;
    snapshot: StabilityPoolSnapshot;
};

/**
 * This Indexer indexes Stability Pool Accounts.
 */
export class StabilityPoolAccountIndexer extends BaseV1Indexer {
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
        const accountTokenCs = this.sysParams.stabilityPoolParams.accountToken[0].unCurrencySymbol;
        const accountTokenTokenName = Buffer.from(this.sysParams.stabilityPoolParams.accountToken[1].unTokenName).toString('hex');

        // Is the TX burning a CDP tokens?
        if (
            tx.mint &&
            accountTokenCs in tx.mint &&
            accountTokenTokenName in tx.mint[accountTokenCs] &&
            Number(tx.mint[accountTokenCs][accountTokenTokenName]) !== 1
        ) {
            const mintAmount = Number(tx.mint[accountTokenCs][accountTokenTokenName]);
            if (mintAmount === -1) {
                await this.database.markStabilityPoolAccountInputsAsConsumed(
                    slot,
                    tx.inputs.map((x) => [x.transaction.id, x.index])
                );
            }
        } else {
            // We are either opening a CDP or adjusting a CDP. Traverse outputs for a CDP output.
            for (const key in tx.outputs) {
                const output = tx.outputs[key];
                const assets = output.value;
                if (
                    assets &&
                    accountTokenCs in assets &&
                    accountTokenTokenName in assets[accountTokenCs] &&
                    output.datum &&
                    typeof output.datum === 'string' &&
                    output.address === config.V1_STABILITY_POOL_ADDRESS
                ) {
                    const mintAmount = tx.mint
                        ? Number(tx.mint[accountTokenCs][accountTokenTokenName])
                        : 0;
                    const spInputs =
                        await this.database.getStabilityPoolAccountFromOutput(
                            tx.inputs.map((x) => [x.transaction.id, x.index])
                        );
                    const account = this.toStabilityPoolAccount(output.datum);
                    const row = {
                        slot: slot,
                        output_hash: tx.id,
                        output_index: Number(key),
                        owner: account.owner,
                        asset: account.asset,
                        snapshotD: account.snapshot.snapshotD,
                        snapshotP: account.snapshot.snapshotP,
                        snapshotS: account.snapshot.snapshotS,
                        snapshotEpoch: account.snapshot.snapshotEpoch,
                        snapshotScale: account.snapshot.snapshotScale,
                        version: 'v1'
                    } as StabilityPoolAccountRow;
                    if (spInputs.length === 0 && mintAmount === 1) {
                        // We are opening a Stability Pool Account.
                        await this.database.insertStabilityPoolAccount(row);
                    } else if (spInputs.length === 1) {
                        console.log(
                            'User is adjusting their Stability Pool Account'
                        );
                        // We are adjusting a Stability Pool Account.
                        // Mark Stability Pool Inputs as consumed
                        await this.database.markStabilityPoolAccountInputsAsConsumed(
                            slot,
                            tx.inputs.map((x) => [x.transaction.id, x.index])
                        );
                        // Insert new Stability Pool record
                        await this.database.insertStabilityPoolAccount(row);
                    } else {
                        console.warn('Stability Pool Account exploit? ', tx.id);
                    }
                }
            }
        }
    }

    toStabilityPoolAccount(datum: string): StabilityPoolAccountDatum {
        const accountDatum = CBOR.decode(Buffer.from(datum, 'hex')).value;
        return {
            owner: accountDatum[0].toString('hex'),
            asset: accountDatum[1].toString(),
            snapshot: this.toStabilityPoolSnapshot(accountDatum[2].value),
        };
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
        return Promise.all([
            this.database.deleteStabilityPoolAccountBySlot(slot),
            this.database.unmarkConsumedStabilityPoolAccountBySlot(slot),
        ]);
    }
}
