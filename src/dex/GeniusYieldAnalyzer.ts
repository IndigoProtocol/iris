import { BaseOrderBookDexAnalyzer } from './BaseOrderBookDexAnalyzer';
import {
    AssetBalance,
    DatumParameters,
    DefinitionConstr,
    DefinitionField,
    OrderBookDexOperation, OrderBookOrderCancellation,
    Transaction,
    Utxo
} from '../types';
import { OrderBookOrder } from '../db/entities/OrderBookOrder';
import { lucidUtils, toDefinitionDatum } from '../utils';
import { AddressDetails, Data } from 'lucid-cardano';
import { DefinitionBuilder } from '../DefinitionBuilder';
import orderDefinition from './definitions/genius-yield/order';
import partialFillDefinition from './definitions/genius-yield/partial-fill';
import { Asset } from '../db/entities/Asset';
import { Dex } from '../constants';
import { OrderBookMatch } from '../db/entities/OrderBookMatch';

/**
 * GeniusYield constants.
 */
const MINT_ASSET_POLICY_ID: string = '22f6999d4effc0ade05f6e1a70b702c65d6b3cdf0e301e4a8267f585';
const REWARD_ADDRESSES: string[] = [
    'addr1vxhjr75nmmt6z2tqkzdar0y46qrljpgnh6yh0jjqe96c94ceefj7w',
];

export class GeniusYieldAnalyzer extends BaseOrderBookDexAnalyzer {

    public async analyzeTransaction(transaction: Transaction): Promise<OrderBookDexOperation[]> {
        return Promise.all([
            this.orders(transaction),
            this.matches(transaction),
            this.cancellations(transaction),
        ]).then((operations: OrderBookDexOperation[][]) => operations.flat());
    }

    protected orders(transaction: Transaction): Promise<OrderBookOrder[]> | OrderBookOrder[] {
        return transaction.outputs.map((output: Utxo) => {
            const hasMintedOrderNft: boolean = transaction.mints.some((balance: AssetBalance) => {
                return balance.asset.policyId === MINT_ASSET_POLICY_ID
                    && balance.quantity === 1n;
            });

            if (! output.datum || ! hasMintedOrderNft) {
                return undefined;
            }

            return this.toOrderBookOrder(transaction, output);
        }).flat().filter((order: OrderBookOrder | undefined) => order !== undefined) as (OrderBookOrder)[];
    }

    protected matches(transaction: Transaction): Promise<(OrderBookMatch | OrderBookOrder)[]> | (OrderBookMatch | OrderBookOrder)[] {
        const hasBurnedAsset: boolean = transaction.mints.some((mintedAssetBalance: AssetBalance) => {
            return mintedAssetBalance.asset.policyId === MINT_ASSET_POLICY_ID
                && mintedAssetBalance.quantity === -1n;
        });
        const hasExistingOrderAsset: boolean = transaction.outputs.some((output: Utxo) => {
            return output.assetBalances.some((balance: AssetBalance) => {
                return balance.asset.policyId === MINT_ASSET_POLICY_ID;
            });
        });

        // Not GY related transaction
        if (! hasBurnedAsset && ! hasExistingOrderAsset) {
            return [];
        }

        const rewardOutput: Utxo | undefined = transaction.outputs.find((output: Utxo) => REWARD_ADDRESSES.includes(output.toAddress));
        const partialFilledOrderOutputs: Utxo[] = transaction.outputs.filter((output: Utxo) => {
            return output.assetBalances.some((balance: AssetBalance) => balance.asset.policyId === MINT_ASSET_POLICY_ID);
        });

        const updatedOrders: OrderBookOrder[] = partialFilledOrderOutputs
            .map((output: Utxo) => this.toOrderBookOrder(transaction, output))
            .filter((order: OrderBookOrder | undefined) => order !== undefined) as (OrderBookOrder)[];

        const orderMatches: OrderBookMatch[] = transaction.outputs
            .filter((output: Utxo) => {
                return ! [
                    rewardOutput?.index,
                    partialFilledOrderOutputs.map((orderOutput: Utxo) => orderOutput.index),
                ].flat().includes(output.index);
            })
            .map((output: Utxo) => {
                if (! output.datum) return undefined;

                try {
                    const definitionField: DefinitionField = toDefinitionDatum(
                        Data.from(output.datum)
                    );
                    const builder: DefinitionBuilder = new DefinitionBuilder(partialFillDefinition);
                    const datumParameters: DatumParameters = builder.pullParameters(definitionField as DefinitionConstr);

                    const addressDetails: AddressDetails = lucidUtils.getAddressDetails(output.toAddress);

                    return OrderBookMatch.make(
                        Dex.GeniusYield,
                        undefined,
                        0,
                        addressDetails.paymentCredential?.hash ?? '',
                        addressDetails.stakeCredential?.hash ?? '',
                        transaction.blockSlot,
                        transaction.hash,
                        output.index,
                        datumParameters.ConsumedTxHash as string,
                    );
                } catch (e) {
                    return undefined;
                }
            }).filter((order: OrderBookMatch | undefined) => order !== undefined) as (OrderBookMatch)[];

        return (orderMatches as (OrderBookMatch | OrderBookOrder)[])
            .concat(updatedOrders);
    }

    protected cancellations(transaction: Transaction): Promise<OrderBookOrderCancellation[]> | OrderBookOrderCancellation[] {
        const hasBurnedAsset: boolean = transaction.mints.some((mintedAssetBalance: AssetBalance) => {
            return mintedAssetBalance.asset.policyId === MINT_ASSET_POLICY_ID
                && mintedAssetBalance.quantity === -1n;
        });

        if (! hasBurnedAsset) return [];

        return transaction.outputs
            .map((output: Utxo) => {
                if (! output.datum) {
                    return undefined;
                }

                try {
                    const definitionField: DefinitionField = toDefinitionDatum(
                        Data.from(output.datum)
                    );
                    const builder: DefinitionBuilder = new DefinitionBuilder(partialFillDefinition);
                    const datumParameters: DatumParameters = builder.pullParameters(definitionField as DefinitionConstr);

                    if (Number(datumParameters.Action) !== 0) {
                        return undefined;
                    }

                    const addressDetails: AddressDetails = lucidUtils.getAddressDetails(output.toAddress);

                    return {
                        type: 'OrderBookOrderCancellation',
                        txHash: datumParameters.ConsumedTxHash,
                        senderPubKeyHash: addressDetails.paymentCredential?.hash,
                        senderStakeKeyHash: addressDetails.stakeCredential?.hash,
                    } as OrderBookOrderCancellation;
                } catch (e) {
                    return undefined;
                }
            })
            .flat()
            .filter((cancellation: OrderBookOrderCancellation | undefined) => cancellation !== undefined) as (OrderBookOrderCancellation)[];
    }

    private toOrderBookOrder(transaction: Transaction, output: Utxo): OrderBookOrder | undefined {
        if (! output.datum) {
            return undefined;
        }

        try {
            const definitionField: DefinitionField = toDefinitionDatum(
                Data.from(output.datum)
            );
            const builder: DefinitionBuilder = new DefinitionBuilder(orderDefinition);
            const datumParameters: DatumParameters = builder.pullParameters(definitionField as DefinitionConstr);

            return OrderBookOrder.make(
                Dex.GeniusYield,
                datumParameters.SwapInTokenPolicyId
                    ? new Asset(datumParameters.SwapInTokenPolicyId as string, datumParameters.SwapInTokenAssetName as string)
                    : 'lovelace',
                datumParameters.SwapOutTokenPolicyId
                    ? new Asset(datumParameters.SwapOutTokenPolicyId as string, datumParameters.SwapOutTokenAssetName as string)
                    : 'lovelace',
                datumParameters.TokenAssetName as string,
                Number(datumParameters.OriginalOffer),
                Number(datumParameters.LeftOverOffer),
                0,
                Number(datumParameters.PriceNumerator) / Number(datumParameters.PriceDenominator),
                Number(datumParameters.PastOrderFills),
                false,
                Number(datumParameters.ContainedFee) + Number(datumParameters.ContainedFeePayment),
                datumParameters.SenderPubKeyHash as string,
                (datumParameters.SenderStakingKeyHash ?? '') as string,
                transaction.blockSlot,
                transaction.hash,
                output.index,
            );
        } catch (e) {
            return undefined;
        }
    }

}
