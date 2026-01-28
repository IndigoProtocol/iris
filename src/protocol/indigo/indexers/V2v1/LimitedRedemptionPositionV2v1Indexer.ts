import { BlockPraos, Transaction, TransactionOutput, Slot } from '@cardano-ogmios/schema';
import { BaseV2v1Indexer } from './BaseV2v1Indexer';
import { decodeBech32 } from '../../helpers';
import CBOR from 'cbor';
import { RedemptionRow } from '../../models/Redemption';

type LRP = {
    owner: string;
    asset: string;
    lovelace_amount: number;
    max_price: number;
}

/**
 * This Indexer updates the database with collector records.
 */
export class LimitedRedemptionPositionV2v1Indexer extends BaseV2v1Indexer {
    /**
     * On Block: Search for any outputs with the collector UTxO
     */
    onBlock(block: BlockPraos): Promise<any> {
        if (block.transactions) {
            const slot = block.slot;
            return Promise.all(
                block.transactions?.map((tx) => this.processTransaction(tx, slot)) ?? []
            );
        }
        return Promise.resolve();
    }

    /**
     * Looks for an outputs to the collector address.
     */
    async processTransaction(tx: Transaction, slot: Slot) {

        const lrps = await this.database.getLimitedRedemptionPositionFromOutput(tx.inputs.map((x) => [x.transaction.id, x.index]));

        // If LRP inputs exist, check if they are being redeemed, if so, create a new redemption record.
        if (lrps.length > 0 && tx.redeemers) {
            for (const lrp of lrps) {
                const inputIndex = tx.inputs.findIndex((x) => x.transaction.id === lrp.output_hash && x.index === lrp.output_index);
                if (inputIndex !== -1) {
                    const input = tx.inputs[inputIndex];
                    const redeemer = tx.redeemers.find((x) => x.validator.index === inputIndex);
                    if (!redeemer) continue;
                    const redeemerCbor = CBOR.decode(Buffer.from(redeemer.redeemer, 'hex'));
                    if ((redeemerCbor.tag === 121 || redeemerCbor.tag === 122) && redeemerCbor.value.length > 0) {
                        const continuingOutput = tx.outputs[redeemerCbor.value[0]];
                        const redeemedLovelace = BigInt(lrp.lovelace_amount) - continuingOutput.value['ada'].lovelace;
                        const redeemedAsset = continuingOutput.value[this.sysParams.cdpParams.cdpAssetSymbol.unCurrencySymbol][Buffer.from(lrp.asset).toString('hex')] - BigInt(lrp.claimable_amount);

                        const redemptionRow: RedemptionRow = {
                            slot: slot,
                            tx_hash: tx.id,
                            asset: lrp.asset,
                            type: 'LRP',
                            cdp_owner: undefined,
                            lovelaces_returned: redeemedLovelace,
                            redeemed_amount: redeemedAsset,
                            interest: 0n,
                            processing_fee_lovelaces: 0n,
                            reimbursement_fee_lovelaces: 0n,
                        }

                        await this.database.insertRedemption(redemptionRow);
                    }
                }
            }
        }

        // Mark existing LRP inputs as consumed
        await this.database.markLimitedRedemptionPositionInputsAsConsumed(slot, tx.inputs.map((x) => [x.transaction.id, x.index]));

        // Find LRP outputs
        const outputs: [TransactionOutput, number, LRP][] = tx.outputs.map((output, index) => {
            if (!output.datum ||
                decodeBech32(output.address).indexOf(this.sysParams.validatorHashes.lrpHash) === -1 ||
                typeof output.datum !== 'string') return undefined;
            const lrp = LimitedRedemptionPositionV2v1Indexer.toLRP(output.datum);
            if (!lrp) return undefined;
            return [output, index, lrp];
        }).filter((x) => x !== undefined) as [TransactionOutput, number, LRP][];

        for (const [output, index, lrp] of outputs) {
            console.log('Limited Redemption Position Found at index:', index, lrp);

            const claimableAmount = output.value && output.value[this.sysParams.cdpParams.cdpAssetSymbol.unCurrencySymbol] && output.value[this.sysParams.cdpParams.cdpAssetSymbol.unCurrencySymbol][Buffer.from(lrp.asset).toString('hex')] ? output.value[this.sysParams.cdpParams.cdpAssetSymbol.unCurrencySymbol][Buffer.from(lrp.asset).toString('hex')] : 0n;
            await this.database.insertLimitedRedemptionPosition({
                slot: slot,
                output_hash: tx.id,
                output_index: index,
                version: 'v2.1',
                asset: lrp.asset,
                lovelace_amount: lrp.lovelace_amount,
                max_price: lrp.max_price,
                claimable_amount: Number(claimableAmount),
                owner: lrp.owner
            })
        }
    }

    /**
     * On rollback: Clean up transactions.
     */
    onRollback(blockHash: string, slot: number): Promise<any> {
        return Promise.all([
            this.database.deleteLimitedRedemptionPositionBySlot(slot),
            this.database.unmarkConsumedLimitedRedemptionPositionBySlot(slot),
        ]);
    }

    private static toLRP(datum: string): LRP | undefined {
        const lrpDatum = CBOR.decode(Buffer.from(datum, 'hex'));
        if (lrpDatum.tag !== 121) return undefined;
        if (lrpDatum.value.length !== 4) return undefined;
        if (lrpDatum.value[2].tag !== 121) return undefined;
        if (isNaN(lrpDatum.value[2].value[0])) return undefined;
        if (isNaN(lrpDatum.value[3])) return undefined;
        return {
            owner: lrpDatum.value[0].toString('hex'),
            asset: lrpDatum.value[1].toString(),
            max_price: Number(lrpDatum.value[2].value[0]),
            lovelace_amount: Number(lrpDatum.value[3])
        };
    }
}
