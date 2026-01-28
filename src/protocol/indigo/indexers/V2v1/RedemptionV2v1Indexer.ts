import {
    BlockPraos,
    Transaction,
    TransactionOutput,
    Redeemer,
    Slot,
} from '@cardano-ogmios/schema';
import CBOR from 'cbor';
import { assetClassToString, decodeBech32 } from '../../helpers';
import { BaseV2v1Indexer } from './BaseV2v1Indexer';
import { CollateralizedDebtPositionUtxoV2v1Indexer } from './CollateralizedDebtPositionUtxoV2v1Indexer';

/**
 * This Indexer updates the database with redemption events.
 */
export class RedemptionV2v1Indexer extends BaseV2v1Indexer {
    /**
     * On Block: Search for any outputs with the oracle UTxO
     */
    onBlock(block: BlockPraos): Promise<any> {
        if (block.transactions) {
            const b = block;
            const slot = block.slot;
            return Promise.all(
                b.transactions?.map((tx) => this.processTransaction(tx, slot)) ?? []
            );
        }
        return Promise.resolve();
    }

    /**
     * Looks for an output with an iAssetToken to process for asset_histories.
     */
    async processTransaction(tx: Transaction, slot: Slot) {
        if (!tx.redeemers) return;
        // Find CDP with Redemption Redeemer, reduces queries on db.
        const redemptionRedeemer = this.findRedemptionRedeemer(
            tx.redeemers
        );
        if (!redemptionRedeemer) return;

        // Find CDP output
        const cdpTokenCs = this.sysParams.cdpParams.cdpAuthToken[0].unCurrencySymbol;
        const cdpTokenTokenName = Buffer.from(this.sysParams.cdpParams.cdpAuthToken[1].unTokenName).toString('hex');
        const cdpOutputs = tx.outputs.filter((out: TransactionOutput) => {
            return (
                out.value &&
                out.value[cdpTokenCs] &&
                out.value[cdpTokenCs][cdpTokenTokenName] === BigInt(1) &&
                decodeBech32(out.address).indexOf(this.sysParams.validatorHashes.cdpHash) !== -1
            );
        });

        if (cdpOutputs.length === 0) return;

        const cdpOutput = cdpOutputs[0];

        if (cdpOutput.datum === undefined) return;

        // Find CDP Inputs
        const cdpInputs =
            await this.database.getCollateralizedDebtPositionFromOutput(
                tx.inputs.map((x) => [x.transaction.id, x.index])
            );
        if (cdpInputs.length !== 1) return;

        const cdpInput = cdpInputs[0];

        // Find iAsset burn amount
        const iAssetCs = this.sysParams.cdpParams.cdpAssetSymbol.unCurrencySymbol;
        const iAssetTokenName = Buffer.from(cdpInput.asset).toString('hex');   
        const iAssetBurned = tx.mint ? tx.mint[iAssetCs][iAssetTokenName] : 0;
        
        const asset = await this.database.getIAsset(cdpInput.asset);
        const assetRedeemed = Math.abs(Number(iAssetBurned));
        const collateralDifference = BigInt(cdpInput.collateralAmount) - cdpOutput.value.ada.lovelace;
        if (asset.redemption_reimbursement_percentage == null || asset.redemption_processing_fee_percentage == null) return;

        let interest = 0n;

        const collectorInputs = await this.database.getCollectorFromOutput(
            tx.inputs.map((x) => [x.transaction.id, x.index])
        );
        if (collectorInputs.length === 1) {
            const collectorInput = collectorInputs[0];
            const collectorOutputs = tx.outputs.filter((out: TransactionOutput) => {
                return (
                    decodeBech32(out.address).indexOf(this.sysParams.validatorHashes.collectorHash) !== -1
                );
            });

            if (collectorOutputs.length === 1) {
                const collectorOutput = collectorOutputs[0];

                interest += BigInt(collectorOutput.value.ada.lovelace) - BigInt(collectorInput.ada_value);
            }
        }

        const treasuryInputs = await this.database.getTreasuryFromOutput(
            tx.inputs.map((x) => [x.transaction.id, x.index])
        );
        if (treasuryInputs.length === 1) {
            const treasuryInput = treasuryInputs[0];
            if (treasuryInput.lovelace_value != null) {
                const treasuryOutputs = tx.outputs.filter((out: TransactionOutput) => {
                    return (
                        decodeBech32(out.address).indexOf(this.sysParams.validatorHashes.treasuryHash) !== -1
                    );
                });

                if (treasuryOutputs.length === 1) {
                    const treasuryOutput = treasuryOutputs[0];

                    interest += BigInt(treasuryOutput.value.ada.lovelace) - BigInt(treasuryInput.lovelace_value);
                }
            }
        }

        const collateralRedeemed = Math.floor(Number(collateralDifference - interest) * (1 + (asset.redemption_reimbursement_percentage / 100_000_000)))
        
        const processingFee = Math.floor(collateralRedeemed * (asset.redemption_processing_fee_percentage / 100_000_000));
        const reimbursementFee = Math.floor(collateralRedeemed * (asset.redemption_reimbursement_percentage / 100_000_000));
        const cdp = CollateralizedDebtPositionUtxoV2v1Indexer.toCDP(cdpOutput.datum);
        
        console.log('Redemption Found:', collateralRedeemed, interest, assetRedeemed, cdpInput.asset, tx.id, slot, processingFee, reimbursementFee, cdp.owner);

        await this.database.insertRedemption({
            slot: slot,
            tx_hash: tx.id,
            asset: cdpInput.asset,
            type: 'CDP',
            cdp_owner: cdp.owner,
            redeemed_amount: BigInt(assetRedeemed),
            interest: BigInt(interest),
            lovelaces_returned: BigInt(collateralRedeemed),
            processing_fee_lovelaces: BigInt(processingFee),
            reimbursement_fee_lovelaces: BigInt(reimbursementFee),
        })
    }

    findRedemptionRedeemer(redeemers: Redeemer[]): [string, any] | undefined {
        for (const redeemerKey in redeemers) {
            const redeemer = redeemers[redeemerKey];
            const redeemerData = CBOR.decode(redeemer.redeemer);
            if (redeemerData.tag === 123 && redeemerData.value.length === 1) {
                return [redeemerKey, redeemerData];
            }
        }
        return undefined;
    }

    /**
     * On rollback: Clean up transactions.
     */
    onRollback(blockHash: string, slot: number): Promise<any> {
        return this.database.deleteRedemptionBySlot(slot);
    }
}
