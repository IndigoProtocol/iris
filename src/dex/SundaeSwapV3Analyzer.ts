import { BaseAmmDexAnalyzer } from './BaseAmmDexAnalyzer';
import {
    AmmDexOperation,
    AssetBalance,
    DatumParameters,
    DefinitionConstr,
    DefinitionField,
    Transaction,
    Utxo,
} from '../types';
import swapDefinition from './definitions/sundaeswap-v3/swap';
import poolDefinition from './definitions/sundaeswap-v3/pool';
import poolDepositDefinition from './definitions/sundaeswap-v3/pool-deposit';
import poolWithdrawDefinition from './definitions/sundaeswap-v3/pool-withdraw';
import zapDefinition from './definitions/sundaeswap-v3/zap';
import { Dex, SwapOrderType } from '../constants';
import { lucidUtils, toDefinitionDatum, tokensMatch } from '../utils';
import { AddressDetails, Data } from 'lucid-cardano';
import { DefinitionBuilder } from '../DefinitionBuilder';
import { Asset, Token } from '../db/entities/Asset';
import { LiquidityPoolSwap } from '../db/entities/LiquidityPoolSwap';
import { LiquidityPoolZap } from '../db/entities/LiquidityPoolZap';
import { LiquidityPoolState } from '../db/entities/LiquidityPoolState';
import { LiquidityPoolDeposit } from '../db/entities/LiquidityPoolDeposit';
import { LiquidityPoolWithdraw } from '../db/entities/LiquidityPoolWithdraw';
import { LiquidityPool } from '../db/entities/LiquidityPool';
import { OperationStatus } from '../db/entities/OperationStatus';

/**
 * SundaeSwap constants.
 */
const LP_TOKEN_POLICY_ID: string = 'e0302560ced2fdcbfcb2602697df970cd0d6a38f94b32703f51c312b';
const CANCEL_ORDER_DATUM: string = 'd87980';
const DEPOSIT_FEE: bigint = 2_000000n;
const ORDER_SCRIPT_HASH: string = 'fa6a58bbe2d0ff05534431c8e2f0ef2cbdc1602a8456e4b13c8f3077';
const CANCEL_REFERENCE_TX_HASHES: string[] = [
    'f9121bf01434f6c263d5b1ffa35a155bed37a1aba641a209b35da7c841082d7b',
];

export class SundaeSwapV3Analyzer extends BaseAmmDexAnalyzer {

    public startSlot: number = 10293143;

    /**
     * Analyze transaction for possible DEX operations.
     */
    public async analyzeTransaction(transaction: Transaction): Promise<AmmDexOperation[]> {
        return Promise.all([
            this.liquidityPoolStates(transaction),
            this.swapOrders(transaction),
            this.zapOrders(transaction),
            this.depositOrders(transaction),
            this.withdrawOrders(transaction),
            this.cancelledOperationInputs(transaction, [ORDER_SCRIPT_HASH], CANCEL_ORDER_DATUM, CANCEL_REFERENCE_TX_HASHES),
        ]).then((operations: AmmDexOperation[][]) => operations.flat(2));
    }

    /**
     * Check for swap orders in transaction.
     */
    protected swapOrders(transaction: Transaction): Promise<LiquidityPoolSwap[]> {
        const promises: Promise<LiquidityPoolSwap | undefined>[] = transaction.outputs.map((output: Utxo) => {
            return new Promise(async (resolve, reject) => {
                if (! output.datum) {
                    return resolve(undefined);
                }

                const addressDetails: AddressDetails = lucidUtils.getAddressDetails(output.toAddress);

                if (addressDetails.paymentCredential?.hash !== ORDER_SCRIPT_HASH) {
                    return resolve(undefined);
                }

                try {
                    const definitionField: DefinitionField = toDefinitionDatum(
                        Data.from(output.datum)
                    );
                    const builder: DefinitionBuilder = new DefinitionBuilder(swapDefinition);
                    const datumParameters: DatumParameters = builder.pullParameters(definitionField as DefinitionConstr);

                    // Impossible to know the swap out token unless we know the tokens in the pool
                    const existingPool: LiquidityPool | undefined = await this.liquidityPoolFromIdentifier(datumParameters.PoolIdentifier as string);

                    if (! existingPool) return reject(`Unable to find ${Dex.SundaeSwapV3} pool with identifier ${datumParameters.PoolIdentifier}`);

                    let swapInToken: Token | undefined;
                    let swapOutToken: Token | undefined;
                    let swapInAmount: bigint;

                    if (output.assetBalances.length > 0) {
                        swapInAmount = output.assetBalances[0].quantity;
                        swapInToken = output.assetBalances[0].asset;
                        swapOutToken = tokensMatch(output.assetBalances[0].asset, existingPool.tokenA ?? 'lovelace')
                            ? existingPool.tokenB
                            : existingPool.tokenA;
                    } else {
                        swapInAmount = output.lovelaceBalance - BigInt(datumParameters.ProtocolFee as number) - DEPOSIT_FEE;
                        swapInToken = 'lovelace';
                        swapOutToken = ! existingPool.tokenA
                            ? existingPool.tokenB
                            : existingPool.tokenA;
                    }

                    return resolve(
                        LiquidityPoolSwap.make(
                            Dex.SundaeSwapV3,
                            datumParameters.PoolIdentifier as string,
                            swapInToken,
                            swapOutToken,
                            Number(swapInAmount),
                            Number(datumParameters.MinReceive),
                            Number(datumParameters.ProtocolFee),
                            datumParameters.SenderPubKeyHash as string,
                            (datumParameters.SenderStakingKeyHash ?? '') as string,
                            transaction.blockSlot,
                            transaction.hash,
                            output.index,
                            output.toAddress,
                            SwapOrderType.Instant,
                            transaction,
                        )
                    );
                } catch (e) {
                    return resolve(undefined);
                }
            });
        });

        return Promise.all(promises)
            .then((swapOrders: (LiquidityPoolSwap | undefined)[]) => {
                return swapOrders.filter((operation: LiquidityPoolSwap | undefined) => operation !== undefined) as LiquidityPoolSwap[]
            })
            .catch(() => Promise.resolve([]));
    }

    /**
     * Check for ZAP orders in transaction.
     */
    protected zapOrders(transaction: Transaction): Promise<LiquidityPoolZap[]> {
        const promises: Promise<LiquidityPoolZap | undefined>[] = transaction.outputs.map((output: Utxo) => {
            return new Promise(async (resolve, reject) => {
                if (! output.datum) {
                    return resolve(undefined);
                }

                const addressDetails: AddressDetails = lucidUtils.getAddressDetails(output.toAddress);

                if (addressDetails.paymentCredential?.hash !== ORDER_SCRIPT_HASH) {
                    return resolve(undefined);
                }

                try {
                    const definitionField: DefinitionField = toDefinitionDatum(
                        Data.from(output.datum)
                    );
                    const builder: DefinitionBuilder = new DefinitionBuilder(zapDefinition);
                    const datumParameters: DatumParameters = builder.pullParameters(definitionField as DefinitionConstr);

                    const tokenA: Token = datumParameters.PoolAssetAPolicyId === ''
                        ? 'lovelace'
                        : new Asset(datumParameters.PoolAssetAPolicyId as string, datumParameters.PoolAssetAAssetName as string);
                    const tokenB: Token = datumParameters.PoolAssetBPolicyId === ''
                        ? 'lovelace'
                        : new Asset(datumParameters.PoolAssetBPolicyId as string, datumParameters.PoolAssetBAssetName as string);

                    return resolve(
                        LiquidityPoolZap.make(
                            Dex.SundaeSwapV3,
                            datumParameters.PoolIdentifier as string,
                            tokenA,
                            tokenB,
                            Number(datumParameters.DepositA),
                            undefined,
                            Number(datumParameters.ProtocolFee),
                            datumParameters.SenderPubKeyHash as string,
                            datumParameters.SenderStakingKeyHash as string,
                            transaction.blockSlot,
                            transaction.hash,
                            output.index,
                            transaction,
                        )
                    );
                } catch (e) {
                    return resolve(undefined);
                }
            });
        });

        return Promise.all(promises)
            .then((zapOrders: (LiquidityPoolZap | undefined)[]) => {
                return zapOrders.filter((operation: LiquidityPoolZap | undefined) => operation !== undefined) as LiquidityPoolZap[]
            })
            .catch(() => Promise.resolve([]));
    }

    /**
     * Check for updated liquidity pool states in transaction.
     */
    protected liquidityPoolStates(transaction: Transaction): LiquidityPoolState[] {
        return transaction.outputs.map((output: Utxo) => {
            if (! output.datum) {
                return undefined;
            }

            const relevantAssets: AssetBalance[] = output.assetBalances.filter((assetBalance: AssetBalance) => {
                return assetBalance.asset.policyId !== LP_TOKEN_POLICY_ID;
            });

            if (! [1, 2].includes(relevantAssets.length)) {
                return undefined;
            }

            const lpToken: Asset | undefined = output.assetBalances.find((assetBalance: AssetBalance) => {
                return assetBalance.asset.policyId === LP_TOKEN_POLICY_ID;
            })?.asset;

            if (! lpToken) {
                return undefined;
            } else {
                lpToken.nameHex = '0014df1' + lpToken.nameHex.substr(7);
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

                const possibleOperationStatuses: OperationStatus[] = this.spentOperationInputs(transaction);

                return LiquidityPoolState.make(
                    Dex.SundaeSwapV3,
                    output.toAddress,
                    datumParameters.PoolIdentifier as string,
                    tokenA,
                    tokenB,
                    lpToken,
                    Number(tokenA === 'lovelace'
                        ? output.lovelaceBalance
                        : relevantAssets[0].quantity),
                    Number(tokenA === 'lovelace'
                        ? relevantAssets[0].quantity
                        : relevantAssets[1].quantity),
                    Number(datumParameters.TotalLpTokens),
                    Number(datumParameters.OpeningFee) / 100,
                    transaction.blockSlot,
                    transaction.hash,
                    possibleOperationStatuses,
                    transaction.inputs,
                    transaction.outputs.filter((sibling: Utxo) => sibling.index !== output.index),
                );
            } catch (e) {
                return undefined;
            }
        }).flat().filter((operation: LiquidityPoolState | undefined) => operation !== undefined) as LiquidityPoolState[];
    }

    /**
     * Check for liquidity pool deposits in transaction.
     */
    protected depositOrders(transaction: Transaction): LiquidityPoolDeposit[] {
        return transaction.outputs.map((output: Utxo) => {
            if (! output.datum) {
                return undefined;
            }

            const addressDetails: AddressDetails = lucidUtils.getAddressDetails(output.toAddress);

            if (addressDetails.paymentCredential?.hash !== ORDER_SCRIPT_HASH) {
                return undefined;
            }

            try {
                const definitionField: DefinitionField = toDefinitionDatum(
                    Data.from(output.datum)
                );
                const builder: DefinitionBuilder = new DefinitionBuilder(poolDepositDefinition);
                const datumParameters: DatumParameters = builder.pullParameters(definitionField as DefinitionConstr);

                return LiquidityPoolDeposit.make(
                    Dex.SundaeSwapV3,
                    datumParameters.PoolIdentifier as string,
                    datumParameters.PoolAssetAPolicyId
                        ? new Asset(datumParameters.PoolAssetAPolicyId as string, datumParameters.PoolAssetAAssetName as string)
                        : 'lovelace',
                    datumParameters.PoolAssetBPolicyId
                        ? new Asset(datumParameters.PoolAssetBPolicyId as string, datumParameters.PoolAssetBAssetName as string)
                        : 'lovelace',
                    Number(datumParameters.DepositA),
                    Number(datumParameters.DepositB),
                    undefined,
                    Number(datumParameters.ProtocolFee),
                    datumParameters.SenderPubKeyHash as string,
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
            if (! output.datum) {
                return undefined;
            }

            const addressDetails: AddressDetails = lucidUtils.getAddressDetails(output.toAddress);

            if (addressDetails.paymentCredential?.hash !== ORDER_SCRIPT_HASH) {
                return undefined;
            }

            try {
                const definitionField: DefinitionField = toDefinitionDatum(
                    Data.from(output.datum)
                );
                const builder: DefinitionBuilder = new DefinitionBuilder(poolWithdrawDefinition);
                const datumParameters: DatumParameters = builder.pullParameters(definitionField as DefinitionConstr);

                return LiquidityPoolWithdraw.make(
                    Dex.SundaeSwapV3,
                    datumParameters.PoolIdentifier as string,
                    new Asset(datumParameters.LpTokenPolicyId as string, datumParameters.LpTokenAssetName as string),
                    Number(datumParameters.LpTokens),
                    undefined,
                    undefined,
                    Number(datumParameters.ProtocolFee),
                    datumParameters.SenderPubKeyHash as string,
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

}
