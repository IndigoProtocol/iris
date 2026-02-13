import { BlockPraos, Transaction, Slot } from '@cardano-ogmios/schema';
import CBOR from 'cbor';
import { AssetClass } from '../../models/SystemParamsV1';
import CryptoJS from 'crypto-js';
import { BaseV2v1Indexer } from './BaseV2v1Indexer';
import config from '../../config';
import { getCdpAddress } from '../../models/SystemParamsV2v1';

type iAsset = {
    name: string;
    price: AssetClass | number;
    interestOracle: AssetClass;
    redemptionRatioPercentage: number;
    maintenanceRatioPercentage: number;
    liquidationRatioPercentage: number;
    debtMintingFeePercentage: number;
    liquidationProcessingFeePercentage: number;
    stabilityPoolWithdrawalFeePercentage: number;
    redemptionReimbursementPercentage: number;
    redemptionProcessingFeePercentage: number;
    interestCollectorPortionPercentage: number;
};

/**
 * This Indexer indexes iAssets.
 */
export class AssetHistoryV2v1Indexer extends BaseV2v1Indexer {
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
        const iAssetTokenCs = this.sysParams.cdpParams.iAssetAuthToken[0].unCurrencySymbol;
        const iAssetTokenTokenName = Buffer.from(this.sysParams.cdpParams.iAssetAuthToken[1].unTokenName).toString('hex');  
        const cdpAddress = getCdpAddress(this.sysParams, config.NETWORK_ID);

        for (const key in tx.outputs) {
            const output = tx.outputs[key];
            const assets = output.value;
            if (
                assets &&
                iAssetTokenCs in assets &&
                iAssetTokenTokenName in assets[iAssetTokenCs] &&
                output.datum &&
                typeof output.datum === 'string' &&
                output.address == cdpAddress
            ) {
                const iasset = this.toIAssetFromDatum(output.datum);
                const hash = CryptoJS.SHA256(tx.id + '#' + key).toString();
                const iassetData = {
                    hash: hash,
                    slot: slot,
                    output_hash: tx.id,
                    output_index: Number(key),
                    asset: iasset.name,
                    mcr: undefined,
                    oracle_nft_cs:
                        typeof iasset.price === 'object'
                            ? iasset.price[0].unCurrencySymbol
                            : undefined,
                    oracle_nft_tn:
                        typeof iasset.price === 'object'
                            ? iasset.price[1].unTokenName
                            : undefined,
                    delist_price:
                        typeof iasset.price === 'number'
                            ? iasset.price
                            : undefined,
                    interest_oracle_nft_cs: iasset.interestOracle[0].unCurrencySymbol,
                    interest_oracle_nft_tn: iasset.interestOracle[1].unTokenName,
                    redemption_ratio_percentage: iasset.redemptionRatioPercentage,
                    maintenance_ratio_percentage: iasset.maintenanceRatioPercentage,
                    liquidation_ratio_percentage: iasset.liquidationRatioPercentage,
                    debt_minting_fee_percentage: iasset.debtMintingFeePercentage,
                    liquidation_processing_fee_percentage: iasset.liquidationProcessingFeePercentage,
                    stability_pool_withdrawal_fee_percentage: iasset.stabilityPoolWithdrawalFeePercentage,
                    redemption_reimbursement_percentage: iasset.redemptionReimbursementPercentage,
                    redemption_processing_fee_percentage: iasset.redemptionProcessingFeePercentage,
                    interest_collector_portion_percentage: iasset.interestCollectorPortionPercentage,
                    base_rates: undefined,
                    version: 'v2.1'
                };

                await this.database.insertAssetHistory(iassetData);
            }
        }
    }

    private toIAssetFromDatum(datum: string): iAsset {
        const cdpDatum = CBOR.decode(Buffer.from(datum, 'hex'))
        if(cdpDatum.tag !== 122) 
            throw new Error('Invalid iAsset Datum');

        const iAssetDatum = CBOR.decode(Buffer.from(datum, 'hex')).value[0].value
        return {
            name: iAssetDatum[0].toString(),
            price:
                iAssetDatum[1].tag === 122
                    ? [
                            {
                                unCurrencySymbol: Buffer.from(
                                    iAssetDatum[1].value[0].value[0].value[0]
                                ).toString('hex'),
                            },
                            {
                                unTokenName: Buffer.from(
                                    iAssetDatum[1].value[0].value[0].value[1]
                                ).toString('hex'),
                            },
                        ]
                    : iAssetDatum[1].value[0],
            interestOracle: [
                {
                    unCurrencySymbol: Buffer.from(
                        iAssetDatum[2].value[0]
                    ).toString('hex'),
                },
                {
                    unTokenName: Buffer.from(
                        iAssetDatum[2].value[1]
                    ).toString('hex'),
                },
            ],
            redemptionRatioPercentage: iAssetDatum[3].value[0],
            maintenanceRatioPercentage: iAssetDatum[4].value[0],
            liquidationRatioPercentage: iAssetDatum[5].value[0],
            debtMintingFeePercentage: iAssetDatum[6].value[0],
            liquidationProcessingFeePercentage: iAssetDatum[7].value[0],
            stabilityPoolWithdrawalFeePercentage: iAssetDatum[8].value[0],
            redemptionReimbursementPercentage: iAssetDatum[9].value[0],
            redemptionProcessingFeePercentage: iAssetDatum[10].value[0],
            interestCollectorPortionPercentage: iAssetDatum[11].value[0],
        } as iAsset;
    }

    /**
     * On rollback:
     * 1. Delete all UTxOs where slot > slot.
     */
    onRollback(blockHash: string, slot: number): Promise<any> {
        return this.database.deleteAssetHistoryBySlot(slot);
    }
}
