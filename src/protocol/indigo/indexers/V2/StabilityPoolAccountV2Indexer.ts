import { BlockPraos, Transaction, Slot } from '@cardano-ogmios/schema';
import { StabilityPoolSnapshot } from '../../models/StabilityPoolSnapshot';
import CBOR from 'cbor';
import { StabilityPoolAccountRow } from '../../models/StabilityPoolAccount';
import { BaseV2Indexer } from './BaseV2Indexer';
import config from '../../config';
import { getStabilityPoolAddress } from '../../models/SystemParamsV2';
import { stringify } from '../../../../utils';

type CreateRequest = {
    type: 'create';
}
type AdjustRequest = {
    type: 'adjust';
    amount: number;
    output_address: string;
}
type CloseRequest = {
    type: 'close';
    output_address: string;
}
type StabilityPoolRequest = 
    CreateRequest |
    AdjustRequest |
    CloseRequest;

type StabilityPoolAccountDatum = {
    asset: string;
    owner: string;
    snapshot: StabilityPoolSnapshot;
    request?: StabilityPoolRequest;
};

/**
 * This Indexer indexes Stability Pool Accounts.
 */
export class StabilityPoolAccountV2Indexer extends BaseV2Indexer {
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
        const stabilityPoolAddress = getStabilityPoolAddress(this.sysParams, config.NETWORK_ID);

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
            for (const key in tx.outputs) {
                const output = tx.outputs[key];
                const assets = output.value;
                if (
                    assets &&
                    // accountTokenCs in assets &&
                    // accountTokenTokenName in assets[accountTokenCs] &&
                    output.datum &&
                    typeof output.datum === 'string' &&
                    output.address === stabilityPoolAddress
                ) {
                    try {
                        const account = this.toStabilityPoolAccount(output.datum);
                        console.log('Stability Pool Account found');
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
                            request: stringify(account.request),
                            version: 'v2'
                        } as StabilityPoolAccountRow;
                    
                        console.log(
                            'Stability Pool Account', row
                        );
                        // We are adjusting a Stability Pool Account.
                        // Mark Stability Pool Inputs as consumed
                        await this.database.markStabilityPoolAccountInputsAsConsumed(
                            slot,
                            tx.inputs.map((x) => [x.transaction.id, x.index])
                        );
                        // Insert new Stability Pool record
                        await this.database.insertStabilityPoolAccount(row);
                    } catch(e) {
                    }
                }
            }
        }
    }

    toStabilityPoolAccount(datum: string): StabilityPoolAccountDatum {
        const spDatum = CBOR.decode(Buffer.from(datum, 'hex'));
        console.log('spDatum', spDatum);
        if (spDatum.tag !== 122) 
            throw new Error('Invalid Stability Pool Account Datum');
        const accountDatum = spDatum.value[0];
        console.log('accountDatum', accountDatum);
        if (accountDatum.tag !== 121)
            throw new Error('Invalid Stability Pool Account Datum');
        return {
            owner: accountDatum.value[0].toString('hex'),
            asset: accountDatum.value[1].toString(),
            snapshot: this.toStabilityPoolSnapshot(accountDatum.value[2].value),
            request: accountDatum.value[3].tag === 121 ? this.toStabilityPoolRequest(accountDatum.value[3].value[0]) : undefined,
        };
    }

    toStabilityPoolRequest(element: any): StabilityPoolRequest {
        if (element.tag === 121) {
            return { type: 'create' };
        } else if (element.tag === 122) {
            return { type: 'adjust', amount: element.value[0], output_address: stringify(element.value[1]) }; // todo: bech32 address
        } else if (element.tag === 123) {
            return { type: 'close', output_address: stringify(element.value[0]) }; // todo: bech32 address
        }
        throw new Error('Invalid Stability Pool Request');
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
