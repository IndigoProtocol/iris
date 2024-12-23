import {
    AssetBalance,
    DatumParameters,
    DefinitionConstr,
    DefinitionField,
    Transaction,
    Utxo,
    HybridOperation,
} from '../types';
import swapDefinition from './definitions/muesliswap/swap';
import poolDefinition from './definitions/muesliswap/pool';
import poolDepositDefinition from './definitions/muesliswap/pool-deposit';
import poolWithdrawDefinition from './definitions/muesliswap/pool-withdraw';
import { lucidUtils, stringify, toDefinitionDatum } from '../utils';
import { AddressDetails, Data } from 'lucid-cardano';
import { DefinitionBuilder } from '../DefinitionBuilder';
import { Dex, SwapOrderType } from '../constants';
import { Asset, Token } from '../db/entities/Asset';
import { LiquidityPoolSwap } from '../db/entities/LiquidityPoolSwap';
import { LiquidityPoolState } from '../db/entities/LiquidityPoolState';
import { LiquidityPoolDeposit } from '../db/entities/LiquidityPoolDeposit';
import { LiquidityPoolWithdraw } from '../db/entities/LiquidityPoolWithdraw';
import { OperationStatus } from '../db/entities/OperationStatus';
import { BaseHybridDexAnalyzer } from './BaseHybridDexAnalyzer';
import { OrderBookMatch } from '../db/entities/OrderBookMatch';
import { OrderBookOrder } from '../db/entities/OrderBookOrder';

/**
 * MuesliSwap constants.
 */
const ORDER_ADDRESSES: string[] = [
    'addr1w84psng20ejqcj6a4gljemu9re65waefct7cnahlhmtcwnq63kxyq',
    'addr1wy2mjh76em44qurn5x73nzqrxua7ataasftql0u2h6g88lc3gtgpz',
    'addr1z8c7eyxnxgy80qs5ehrl4yy93tzkyqjnmx0cfsgrxkfge27q47h8tv3jp07j8yneaxj7qc63zyzqhl933xsglcsgtqcqxzc2je',
    'addr1z8l28a6jsx4870ulrfygqvqqdnkdjc5sa8f70ys6dvgvjqc3r6dxnzml343sx8jweqn4vn3fz2kj8kgu9czghx0jrsyqxyrhvq',
    'addr1zyq0kyrml023kwjk8zr86d5gaxrt5w8lxnah8r6m6s4jp4g3r6dxnzml343sx8jweqn4vn3fz2kj8kgu9czghx0jrsyqqktyhv',
];
const BATCH_ORDER_CONTRACT_ADDRESS: string = 'addr1w9e7m6yn74r7m0f9mf548ldr8j4v6q05gprey2lhch8tj5gsvyte9';
const POOL_NFT_POLICY_IDS: string[] = [
    '909133088303c49f3a30f1cc8ed553a73857a29779f6c6561cd8093f',
    '7a8041a0693e6605d010d5185b034d55c79eaf7ef878aae3bdcdbf67',
];
const LP_TOKEN_POLICY_ID: string = 'af3d70acf4bd5b3abb319a7d75c89fb3e56eafcdd46b2e9b57a2557f';
const CANCEL_ORDER_DATUM: string = 'd87980';
const MUESLISWAP_HEX: string = '4d7565736c6953776170';

const METADATA_MSG_LABEL: string = '674';
const METADATA_SENDER: string = '1000';
const METADATA_IN_POLICY_ID: string = '1008';
const METADATA_IN_NAME_HEX: string = '1009';
const METADATA_OUT_POLICY_ID: string = '1002';
const METADATA_OUT_NAME_HEX: string = '1003';
const METADATA_MIN_RECEIVE: string = '1004';
const METADATA_FEES_PAID: string = '1005';

export class MuesliSwapAnalyzer extends BaseHybridDexAnalyzer {

    public startSlot: number = 65063916;

    /**
     * Analyze transaction for possible DEX operations.
     */
    public async analyzeTransaction(transaction: Transaction): Promise<HybridOperation[]> {
        return Promise.all([
            this.matches(transaction),
            this.liquidityPoolStates(transaction),
            this.swapOrders(transaction),
            this.depositOrders(transaction),
            this.withdrawOrders(transaction),
            this.cancelledOperationInputs(transaction, ORDER_ADDRESSES, CANCEL_ORDER_DATUM),
        ]).then((operations: HybridOperation[][]) => operations.flat(2));
    }

    protected matches(transaction: Transaction): Promise<(OrderBookMatch | OrderBookOrder)[]> | (OrderBookMatch | OrderBookOrder)[] {
        if (
            ! transaction.metadata
            || ! transaction.metadata[METADATA_MSG_LABEL]
            || ! stringify(transaction.metadata[METADATA_MSG_LABEL]).includes('MuesliSwap Partial')
        ) {
            return [];
        }

        const updatedOrderUtxo: Utxo | undefined = transaction.outputs.find((output: Utxo) => {
            return output.datum && ORDER_ADDRESSES.includes(output.toAddress);
        });

        if (! updatedOrderUtxo) return [];

        const receiverUtxo: Utxo | undefined = transaction.outputs.find((output: Utxo) => {
            return output.datum && output.datum.includes(MUESLISWAP_HEX);
        });

        if (! receiverUtxo) return [];

        const receiverDetails: AddressDetails = lucidUtils.getAddressDetails(receiverUtxo.toAddress);
        const swapOrder: LiquidityPoolSwap | undefined = this.swapOrderFromUtxo(transaction, updatedOrderUtxo);

        if (! swapOrder) return [];

        const updatedOrder: OrderBookOrder = OrderBookOrder.make(
            Dex.MuesliSwap,
            swapOrder.swapInToken ?? 'lovelace',
            swapOrder.swapOutToken ?? 'lovelace',
            '',
            swapOrder.swapInAmount,
            swapOrder.swapInAmount,
            swapOrder.minReceive ?? 0,
            Number(swapOrder.swapInAmount) / Number(swapOrder.minReceive),
            0, // Handler will take care of this
            false,
            swapOrder.dexFeesPaid,
            swapOrder.senderPubKeyHash,
            swapOrder.senderStakeKeyHash,
            swapOrder.slot,
            swapOrder.txHash,
            swapOrder.outputIndex,
        );

        return [
            updatedOrder,
            OrderBookMatch.make(
                Dex.MuesliSwap,
                undefined,
                0,
                receiverDetails.paymentCredential?.hash ?? '',
                receiverDetails.stakeCredential?.hash ?? '',
                transaction.blockSlot,
                transaction.hash,
                updatedOrderUtxo.index,
                '',
                '',
                undefined,
                transaction,
                swapOrder.minReceive,
            )
        ];
    }

    /**
     * Check for swap orders in transaction.
     */
    protected swapOrders(transaction: Transaction): LiquidityPoolSwap[] {
        // Skip processing matches since they look like new orders
        if (
            transaction.metadata
            && transaction.metadata[METADATA_MSG_LABEL]
            && stringify(transaction.metadata[METADATA_MSG_LABEL]).includes('MuesliSwap Partial Match Order')
        ) {
            return [];
        }

        return transaction.outputs.map((output: Utxo) => {
            return this.swapOrderFromUtxo(transaction, output);
        }).filter((operation: LiquidityPoolSwap | undefined) => operation !== undefined) as LiquidityPoolSwap[];
    }

    /**
     * Check for updated liquidity pool states in transaction.
     */
    protected liquidityPoolStates(transaction: Transaction): LiquidityPoolState[] {
        return transaction.outputs.map((output: Utxo) => {
            if (! output.datum) {
                return undefined;
            }

            // Check if pool output is valid
            const hasPoolNft: boolean = output.assetBalances.some((balance: AssetBalance) => {
                return ['MuesliSwap_cLP', 'MuesliSwap_AMM'].includes(balance.asset.assetName);
            });

            if (! hasPoolNft) {
                return undefined;
            }

            try {
                const definitionField: DefinitionField = toDefinitionDatum(
                    Data.from(output.datum)
                );
                const builder: DefinitionBuilder = new DefinitionBuilder(poolDefinition);
                const datumParameters: DatumParameters = builder.pullParameters(definitionField as DefinitionConstr);

                const tokenA: Token = datumParameters.PoolAssetAPolicyId === ''
                    ? 'lovelace'
                    : new Asset(datumParameters.PoolAssetAPolicyId as string, datumParameters.PoolAssetAAssetName as string);
                const tokenB: Token = datumParameters.PoolAssetBPolicyId === ''
                    ? 'lovelace'
                    : new Asset(datumParameters.PoolAssetBPolicyId as string, datumParameters.PoolAssetBAssetName as string);
                const poolNft: Asset | undefined = output.assetBalances.find((balance: AssetBalance) => {
                    return POOL_NFT_POLICY_IDS.includes(balance.asset.policyId);
                })?.asset;

                if (! poolNft) return undefined;

                const lpToken: Asset = new Asset(LP_TOKEN_POLICY_ID, poolNft.nameHex);
                const reserveA: bigint = tokenA === 'lovelace'
                    ? output.lovelaceBalance
                    : output.assetBalances.find((balance: AssetBalance) =>  balance.asset.identifier() === tokenA.identifier())?.quantity ?? 0n;
                const reserveB: bigint = tokenB === 'lovelace'
                    ? output.lovelaceBalance
                    : output.assetBalances.find((balance: AssetBalance) =>  balance.asset.identifier() === tokenB.identifier())?.quantity ?? 0n;

                const possibleOperationStatuses: OperationStatus[] = this.spentOperationInputs(transaction);

                return LiquidityPoolState.make(
                    Dex.MuesliSwap,
                    output.toAddress,
                    lpToken.identifier(),
                    tokenA,
                    tokenB,
                    lpToken,
                    Number(reserveA),
                    Number(reserveB),
                    Number(datumParameters.TotalLpTokens),
                    Number(datumParameters.LpFee) / 100,
                    transaction.blockSlot,
                    transaction.hash,
                    possibleOperationStatuses,
                    transaction.inputs,
                    transaction.outputs.filter((sibling: Utxo) => sibling.index !== output.index),
                )
            } catch (e) {
                return undefined;
            }
        }).flat().filter((operation: LiquidityPoolState | undefined) => operation !== undefined) as (LiquidityPoolState)[];
    }

    /**
     * Check for liquidity pool deposits in transaction.
     */
    protected depositOrders(transaction: Transaction): LiquidityPoolDeposit[] {
        return transaction.outputs.map((output: Utxo) => {
            if (output.toAddress !== BATCH_ORDER_CONTRACT_ADDRESS || ! output.datum) {
                return undefined;
            }

            try {
                const definitionField: DefinitionField = toDefinitionDatum(
                    Data.from(output.datum)
                );
                const builder: DefinitionBuilder = new DefinitionBuilder(poolDepositDefinition);
                const datumParameters: DatumParameters = builder.pullParameters(definitionField as DefinitionConstr);

                let depositAToken: Token = output.assetBalances.length > 1
                    ? output.assetBalances[0].asset
                    : 'lovelace';
                let depositBToken: Token = depositAToken === 'lovelace'
                    ? output.assetBalances[0].asset
                    : output.assetBalances[1].asset;

                return LiquidityPoolDeposit.make(
                    Dex.MuesliSwap,
                    undefined,
                    depositAToken,
                    depositBToken,
                    Number(depositAToken === 'lovelace'
                        ? (output.lovelaceBalance - BigInt(datumParameters.BatcherFee as number) - BigInt(datumParameters.Deposit as number))
                        : output.assetBalances[0].quantity),
                    Number(depositAToken === 'lovelace'
                        ? output.assetBalances[0].quantity
                        : output.assetBalances[1].quantity),
                    Number(datumParameters.MinReceive),
                    Number(datumParameters.BatcherFee),
                    datumParameters.ReceiverPubKeyHash as string,
                    (datumParameters.SenderStakingKeyHash ?? '') as string,
                    transaction.blockSlot,
                    transaction.hash,
                    output.index,
                    transaction,
                );
            } catch (e) {
                return undefined;
            }
        }).filter((operation: LiquidityPoolDeposit | undefined) => operation !== undefined) as LiquidityPoolDeposit[];
    }

    /**
     * Check for liquidity pool withdraws in transaction.
     */
    protected withdrawOrders(transaction: Transaction): LiquidityPoolWithdraw[] {
        return transaction.outputs.map((output: Utxo) => {
            if (output.toAddress !== BATCH_ORDER_CONTRACT_ADDRESS || ! output.datum) {
                return undefined;
            }

            try {
                const definitionField: DefinitionField = toDefinitionDatum(
                    Data.from(output.datum)
                );
                const builder: DefinitionBuilder = new DefinitionBuilder(poolWithdrawDefinition);
                const datumParameters: DatumParameters = builder.pullParameters(definitionField as DefinitionConstr);

                return LiquidityPoolWithdraw.make(
                    Dex.MuesliSwap,
                    undefined,
                    output.assetBalances[0].asset,
                    Number(output.assetBalances[0].quantity),
                    Number(datumParameters.MinReceiveA),
                    Number(datumParameters.MinReceiveB),
                    Number(datumParameters.BatcherFee),
                    datumParameters.ReceiverPubKeyHash as string,
                    (datumParameters.SenderStakingKeyHash ?? '') as string,
                    transaction.blockSlot,
                    transaction.hash,
                    output.index,
                    transaction,
                );
            } catch (e) {
                return undefined;
            }
        }).filter((operation: LiquidityPoolWithdraw | undefined) => operation !== undefined) as LiquidityPoolWithdraw[];
    }

    private swapOrderFromUtxo(transaction: Transaction, output: Utxo, isRetry: boolean = false): LiquidityPoolSwap | undefined {
        if (! output.datum || ! ORDER_ADDRESSES.includes(output.toAddress)) {
            return undefined;
        }

        let swapInToken: Token | undefined;
        let swapOutToken: Token | undefined;
        let swapInAmount: bigint;
        let totalFees: bigint;
        let minReceive: bigint;
        let senderPubKeyHash: string;
        let senderStakeKeyHash: string;

        if (! isRetry) {
            try {
                const definitionField: DefinitionField = toDefinitionDatum(
                    Data.from(output.datum)
                );

                const builder: DefinitionBuilder = new DefinitionBuilder(swapDefinition);
                const datumParameters: DatumParameters = builder.pullParameters(definitionField as DefinitionConstr);

                if (datumParameters.SwapOutTokenPolicyId === '') { // X -> ADA
                    swapInToken = output.assetBalances[0].asset;
                    swapOutToken = 'lovelace';
                    swapInAmount = output.assetBalances[0].quantity;
                } else { // ADA/Y -> X
                    swapOutToken = new Asset(datumParameters.SwapOutTokenPolicyId as string, datumParameters.SwapOutTokenAssetName as string);

                    if (output.assetBalances.length > 0) { // Y -> X
                        swapInToken = output.assetBalances[0].asset;
                        swapInAmount = output.assetBalances[0].quantity;
                    } else { // ADA -> X
                        swapInToken = 'lovelace';
                        swapInAmount = output.lovelaceBalance
                            - BigInt(datumParameters.TotalFees as number);
                    }
                }

                senderPubKeyHash = datumParameters.SenderPubKeyHash as string;
                senderStakeKeyHash = (datumParameters.SenderStakingKeyHash ?? '') as string;
                totalFees = BigInt(datumParameters.TotalFees ?? 0);
                minReceive = BigInt(datumParameters.MinReceive ?? 0);
            } catch (e: any) {
                return this.swapOrderFromUtxo(transaction, output, true);
            }
        } else {
            if (
                ! transaction.metadata
                || ! (METADATA_SENDER in transaction.metadata)
                || ! (METADATA_IN_POLICY_ID in transaction.metadata)
                || ! (METADATA_IN_NAME_HEX in transaction.metadata)
                || ! (METADATA_OUT_POLICY_ID in transaction.metadata)
                || ! (METADATA_OUT_NAME_HEX in transaction.metadata)
                || ! (METADATA_MIN_RECEIVE in transaction.metadata)
                || ! (METADATA_FEES_PAID in transaction.metadata)
                || ! transaction.metadata[METADATA_SENDER]
            ) {
                return undefined;
            }

            swapInToken = transaction.metadata[METADATA_IN_POLICY_ID]
                ? new Asset(transaction.metadata[METADATA_IN_POLICY_ID], transaction.metadata[METADATA_IN_NAME_HEX])
                : 'lovelace';
            swapOutToken = transaction.metadata[METADATA_OUT_POLICY_ID]
                ? new Asset(transaction.metadata[METADATA_OUT_POLICY_ID], transaction.metadata[METADATA_OUT_NAME_HEX])
                : 'lovelace';
            totalFees = BigInt(transaction.metadata[METADATA_FEES_PAID]);
            swapInAmount = swapInToken === 'lovelace'
                ? output.lovelaceBalance - totalFees
                : output.assetBalances[0].quantity;
            minReceive = BigInt(transaction.metadata[METADATA_MIN_RECEIVE]);
            senderPubKeyHash = (transaction.metadata[METADATA_SENDER] as string).substr(2, 58);
            senderStakeKeyHash = (transaction.metadata[METADATA_SENDER] as string).substr(58);
        }

        return LiquidityPoolSwap.make(
            Dex.MuesliSwap,
            undefined,
            swapInToken,
            swapOutToken,
            Number(swapInAmount),
            Math.max(Number(minReceive), 0),
            Number(totalFees),
            senderPubKeyHash,
            senderStakeKeyHash,
            transaction.blockSlot,
            transaction.hash,
            output.index,
            output.toAddress,
            SwapOrderType.Instant,
            transaction,
        );
    }

}
