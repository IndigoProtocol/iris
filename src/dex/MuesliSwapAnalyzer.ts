import { BaseAmmDexAnalyzer } from './BaseAmmDexAnalyzer';
import {
    AssetBalance,
    DatumParameters,
    DefinitionConstr,
    DefinitionField,
    AmmDexOperation,
    Transaction,
    Utxo,
} from '../types';
import swapDefinition from './definitions/muesliswap/swap';
import poolDefinition from './definitions/muesliswap/pool';
import poolDepositDefinition from './definitions/muesliswap/pool-deposit';
import poolWithdrawDefinition from './definitions/muesliswap/pool-withdraw';
import { toDefinitionDatum } from '../utils';
import { Data } from 'lucid-cardano';
import { DefinitionBuilder } from '../DefinitionBuilder';
import { Dex } from '../constants';
import { Asset, Token } from '../db/entities/Asset';
import { LiquidityPoolSwap } from '../db/entities/LiquidityPoolSwap';
import { LiquidityPoolState } from '../db/entities/LiquidityPoolState';
import { LiquidityPoolDeposit } from '../db/entities/LiquidityPoolDeposit';
import { LiquidityPoolWithdraw } from '../db/entities/LiquidityPoolWithdraw';
import { OperationStatus } from '../db/entities/OperationStatus';
import { LiquidityPoolZap } from '../db/entities/LiquidityPoolZap';

/**
 * MuesliSwap constants.
 */
const ORDER_V1_CONTRACT_ADDRESS: string = 'addr1z8c7eyxnxgy80qs5ehrl4yy93tzkyqjnmx0cfsgrxkfge27q47h8tv3jp07j8yneaxj7qc63zyzqhl933xsglcsgtqcqxzc2je';
const ORDER_V2_CONTRACT_ADDRESS: string = 'addr1z8l28a6jsx4870ulrfygqvqqdnkdjc5sa8f70ys6dvgvjqc3r6dxnzml343sx8jweqn4vn3fz2kj8kgu9czghx0jrsyqxyrhvq';
const ORDER_V3_CONTRACT_ADDRESS: string = 'addr1zyq0kyrml023kwjk8zr86d5gaxrt5w8lxnah8r6m6s4jp4g3r6dxnzml343sx8jweqn4vn3fz2kj8kgu9czghx0jrsyqqktyhv';
const BATCH_ORDER_CONTRACT_ADDRESS: string = 'addr1w9e7m6yn74r7m0f9mf548ldr8j4v6q05gprey2lhch8tj5gsvyte9';
const POOL_NFT_POLICY_ID: string = '909133088303c49f3a30f1cc8ed553a73857a29779f6c6561cd8093f';
const LP_TOKEN_POLICY_ID: string = 'af3d70acf4bd5b3abb319a7d75c89fb3e56eafcdd46b2e9b57a2557f';
const CANCEL_ORDER_DATUM: string = 'd87980';

export class MuesliSwapAnalyzer extends BaseAmmDexAnalyzer {

    /**
     * Analyze transaction for possible DEX operations.
     */
    public analyzeTransaction(transaction: Transaction): Promise<AmmDexOperation[]> {
        return Promise.all([
            this.liquidityPoolStates(transaction),
            this.swapOrders(transaction),
            this.depositOrders(transaction),
            this.withdrawOrders(transaction),
            this.cancelledOperationInputs(transaction, [ORDER_V1_CONTRACT_ADDRESS, ORDER_V2_CONTRACT_ADDRESS, ORDER_V3_CONTRACT_ADDRESS], CANCEL_ORDER_DATUM),
        ]).then((operations: AmmDexOperation[][]) => operations.flat(2));
    }

    protected zapOrders(transaction: Transaction): Promise<LiquidityPoolZap[]> {
        return Promise.resolve([]);
    }

    /**
     * Check for swap orders in transaction.
     */
    protected swapOrders(transaction: Transaction): LiquidityPoolSwap[] {
        return transaction.outputs.map((output: Utxo) => {
            if (! [ORDER_V1_CONTRACT_ADDRESS, ORDER_V2_CONTRACT_ADDRESS, ORDER_V3_CONTRACT_ADDRESS].includes(output.toAddress) || ! output.datum) {
                return undefined;
            }

            try {
                const definitionField: DefinitionField = toDefinitionDatum(
                    Data.from(output.datum)
                );
                const builder: DefinitionBuilder = new DefinitionBuilder(swapDefinition);
                const datumParameters: DatumParameters = builder.pullParameters(definitionField as DefinitionConstr);

                let swapInToken: Token | undefined;
                let swapOutToken: Token | undefined;
                let swapInAmount: bigint;

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

                return LiquidityPoolSwap.make(
                    Dex.MuesliSwap,
                    undefined,
                    swapInToken,
                    swapOutToken,
                    Number(swapInAmount),
                    Number(datumParameters.MinReceive),
                    Number(datumParameters.TotalFees),
                    datumParameters.SenderPubKeyHash as string,
                    (datumParameters.SenderStakingKeyHash ?? '') as string,
                    transaction.blockSlot,
                    transaction.hash,
                    output.index,
                );
            } catch (e) {
                return undefined;
            }
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
            const hasPoolNft: boolean = output.assetBalances.some((balance: AssetBalance) => balance.asset.assetName === 'MuesliSwap_AMM');
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
                    return balance.asset.policyId === POOL_NFT_POLICY_ID;
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
                );
            } catch (e) {
                return undefined;
            }
        }).filter((operation: LiquidityPoolWithdraw | undefined) => operation !== undefined) as LiquidityPoolWithdraw[];
    }

}
