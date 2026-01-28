import {
    BlockPraos,
    Transaction,
    TransactionOutput,
    Redeemer,
    Slot,
} from '@cardano-ogmios/schema';
import CBOR from 'cbor';
import { assetClassToString } from '../../helpers';
import { BaseV1Indexer } from './BaseV1Indexer';
import config from '../../config';

/**
 * This Indexer updates the database with liquidation events.
 */
export class LiquidationIndexer extends BaseV1Indexer {
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
        // Find CDP or Stability Pool Input with Liquidation Redeemer, reduces queries on db.
        const liquidationRedeemer = this.findLiquidationRedeemer(
            tx.redeemers
        );
        if (!liquidationRedeemer) return;

        // Find Stability Pool output
        const stabilityPoolCs = this.sysParams.stabilityPoolParams.stabilityPoolToken[0].unCurrencySymbol;
        const stabilityPoolTokenName = Buffer.from(this.sysParams.stabilityPoolParams.stabilityPoolToken[1].unTokenName).toString('hex');
        const spOutputs = tx.outputs.filter((out: TransactionOutput) => {
            return (
                out.value &&
                out.value[stabilityPoolCs] &&
                out.value[stabilityPoolCs][stabilityPoolTokenName] === BigInt(1) &&
                out.address === config.V1_STABILITY_POOL_ADDRESS
            );
        });
        if (spOutputs.length !== 1) return;

        // Find CDP Inputs
        const cdpInputs =
            await this.database.getCollateralizedDebtPositionFromOutput(
                tx.inputs.map((x) => [x.transaction.id, x.index])
            );
        if (cdpInputs.length !== 1) return;

        // Find Stability Pool Input
        const spInputs = await this.database.getStabilityPoolFromOutput(
            tx.inputs.map((x) => [x.transaction.id, x.index])
        );
        if (spInputs.length !== 1) return;

        const cdpInput = cdpInputs[0];

        // Find iAsset burn amount
        const iAssetCs = this.sysParams.cdpParams.cdpAssetSymbol.unCurrencySymbol;
        const iAssetTokenName = Buffer.from(cdpInput.asset).toString('hex');   
        const iAssetBurned = tx.mint
            ? tx.mint[iAssetCs][iAssetTokenName]
            : 0;

        // Find (optional) CDP output
        const cdpTokenCs = this.sysParams.cdpParams.cdpAuthToken[0].unCurrencySymbol;
        const cdpTokenTokenName = Buffer.from(this.sysParams.cdpParams.cdpAuthToken[1].unTokenName).toString('hex');
        const cdpOutputs = tx.outputs.filter((out: TransactionOutput) => {
            return (
                out.value &&
                out.value[cdpTokenCs] &&
                out.value[cdpTokenCs][cdpTokenTokenName] === BigInt(1) &&
                out.address === config.V1_CDP_ADDRESS
            );
        });
        const cdpOutput = cdpOutputs[0];

        const collateralAbsorbed =
            BigInt(cdpInput.collateralAmount) *
            (BigInt(-iAssetBurned) / BigInt(cdpInput.mintedAmount));

        console.log(
            cdpInput.asset + ' Liquidation Found.',
            collateralAbsorbed,
            'Collateral Absorbed,',
            iAssetBurned,
            'iAsset Burned'
        );

        await this.database.insertLiquidation({
            slot: slot,
            output_hash: cdpInput.output_hash,
            output_index: cdpInput.output_index,
            asset: cdpInput.asset,
            collateral_absorbed: collateralAbsorbed,
            iasset_burned: BigInt(-iAssetBurned),
        });
    }

    findLiquidationRedeemer(redeemers: Redeemer[]): [string, any] | undefined {
        for (const redeemerKey in redeemers) {
            const redeemer = redeemers[redeemerKey];
            const redeemerData = CBOR.decode(redeemer.redeemer);
            if (redeemerData.tag === 123 && redeemerData.value.length === 0) {
                return [redeemerKey, redeemerData];
            }
        }
        return undefined;
    }

    /**
     * On rollback: Clean up transactions.
     */
    onRollback(blockHash: string, slot: number): Promise<any> {
        return this.database.deleteLiquidationBySlot(slot);
    }
}
