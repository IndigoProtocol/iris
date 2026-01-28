import { BlockPraos, Transaction, Slot } from '@cardano-ogmios/schema';
import CBOR from 'cbor';
import { assetClassToString, decodeBech32 } from '../../helpers';
import { BaseV1Indexer } from './BaseV1Indexer';
import config from '../../config';

type CDP = {
    owner: string | undefined;
    asset: string;
    mintedAmount: number;
};

/**
 * This Indexer indexes Collateralized Debt Positions.
 */
export class CollateralizedDebtPositionUtxoIndexer extends BaseV1Indexer {
    /*
     * For each transaction look for the following events:
     * 1. The minting of a CDP token.
     * 2. The updating of a CDP token.
     * 3. The burning of a CDP token.
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
        const cdpTokenCs = this.sysParams.cdpParams.cdpAuthToken[0].unCurrencySymbol;
        const cdpTokenTokenName = Buffer.from(this.sysParams.cdpParams.cdpAuthToken[1].unTokenName).toString('hex');

        // Is the TX burning a CDP tokens?
        if (
            tx.mint &&
            cdpTokenCs in tx.mint &&
            cdpTokenTokenName in tx.mint[cdpTokenCs] &&
            Number(tx.mint[cdpTokenCs][cdpTokenTokenName]) !== 1
        ) {
            const mintAmount = Number(tx.mint[cdpTokenCs][cdpTokenTokenName]);
            if (mintAmount === -1) {
                // CDP Closed (or a Liquidation occured of a Merged CDP?)
                await this.database.markCollateralizedDebtPositionInputsAsConsumed(
                    slot,
                    tx.inputs.map((x) => [x.transaction.id, x.index])
                );
            } else {
                console.error('Unhandled situation - CDP#1');
            }
        } else {
            // We are either opening a CDP or adjusting a CDP. Traverse outputs for a CDP output.
            for (const key in tx.outputs) {
                const output = tx.outputs[key];
                const assets = output.value;
                if (
                    assets &&
                    cdpTokenCs in assets &&
                    cdpTokenTokenName in assets[cdpTokenCs] &&
                    output.datum &&
                    typeof output.datum === 'string' &&
                    (config.V1_CDP_VAL_HASH && decodeBech32(output.address).indexOf(config.V1_CDP_VAL_HASH) !== -1)
                ) {
                    const mintAmount = tx.mint && tx.mint[cdpTokenCs]
                        ? Number(tx.mint[cdpTokenCs][cdpTokenTokenName])
                        : 0;
                    const cdpInputs =
                        await this.database.getCollateralizedDebtPositionFromOutput(
                            tx.inputs.map((x) => [x.transaction.id, x.index])
                        );
                    const cdp = this.toCDP(output.datum);
                    const collateralAmount = Number(output.value.ada.lovelace);
                    if (cdpInputs.length === 0 && mintAmount === 1) {
                        console.log('User is opening a CDP');
                        // We are opening a CDP.
                        await this.database.insertCollateralizedDebtPosition({
                            slot: slot,
                            output_hash: tx.id,
                            output_index: Number(key),
                            owner: cdp.owner,
                            asset: cdp.asset,
                            mintedAmount: cdp.mintedAmount,
                            collateralAmount: collateralAmount,
                            version: 'v1'
                        });
                    } else if (cdpInputs.length >= 1) {
                        console.log(
                            'User is adjusting their CDP, merging CDPs, or freezing a CDP'
                        );
                        // We are adjusting a CDP.

                        // Mark existing CDP inputs as consumed
                        await this.database.markCollateralizedDebtPositionInputsAsConsumed(
                            slot,
                            tx.inputs.map((x) => [x.transaction.id, x.index])
                        );

                        // Insert new CDP.
                        await this.database.insertCollateralizedDebtPosition({
                            slot: slot,
                            output_hash: tx.id,
                            output_index: Number(key),
                            owner: cdp.owner,
                            asset: cdp.asset,
                            mintedAmount: cdp.mintedAmount,
                            collateralAmount: collateralAmount,
                            version: 'v1'
                        });
                    } else {
                        console.error('Unknown case for CDPs.');
                    }
                }
            }
        }
    }

    private toCDP(datum: string): CDP {
        const cdpDatum = CBOR.decode(Buffer.from(datum, 'hex')).value;
        return {
            owner:
                cdpDatum[0].tag === 121
                    ? cdpDatum[0].value[0].toString('hex')
                    : undefined,
            asset: cdpDatum[1].toString(),
            mintedAmount: Number(cdpDatum[2]),
        };
    }

    /**
     * On rollback:
     * 1. Delete all UTxOs where slot > slot.
     * 2. Update all UTxOs where consumed > slot, setting consumed = null.
     */
    onRollback(blockHash: string, slot: number): Promise<any> {
        return Promise.all([
            this.database.deleteCollateralizedDebtPositionBySlot(slot),
            this.database.unmarkConsumedCollateralizedDebtPositionBySlot(slot),
        ]);
    }
}
