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
import swapDefinition from './definitions/sundaeswap/swap';
import poolDefinition from './definitions/sundaeswap/pool';
import poolDepositDefinition from './definitions/sundaeswap/pool-deposit';
import poolWithdrawDefinition from './definitions/sundaeswap/pool-withdraw';
import zapDefinition from './definitions/sundaeswap/zap';
import { Dex } from '../constants';
import { toDefinitionDatum, tokensMatch } from '../utils';
import { Data } from 'lucid-cardano';
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
const ORDER_CONTRACT_ADDRESS: string = 'addr1wxaptpmxcxawvr3pzlhgnpmzz3ql43n2tc8mn3av5kx0yzs09tqh8';
const POOL_CONTRACT_ADDRESS: string = 'addr1w9qzpelu9hn45pefc0xr4ac4kdxeswq7pndul2vuj59u8tqaxdznu';
const LP_TOKEN_POLICY_ID: string = '0029cb7c88c7567b63d1a512c0ed626aa169688ec980730c0473b913';
const CANCEL_ORDER_DATUM: string = 'd87a80';
const DEPOSIT_FEE: bigint = 2_000000n;

export class SundaeSwapAnalyzer extends BaseAmmDexAnalyzer {

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
            this.cancelledOperationInputs(transaction, [ORDER_CONTRACT_ADDRESS], CANCEL_ORDER_DATUM),
        ]).then((operations: AmmDexOperation[][]) => operations.flat(2));
    }

    /**
     * Check for swap orders in transaction.
     */
    protected swapOrders(transaction: Transaction): Promise<LiquidityPoolSwap[]> {
        const promises: Promise<LiquidityPoolSwap | undefined>[] = transaction.outputs.map((output: Utxo) => {
            return new Promise(async (resolve, reject) => {
                if (output.toAddress !== ORDER_CONTRACT_ADDRESS || ! output.datum) {
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

                    if (! existingPool) return reject(`Unable to find ${Dex.SundaeSwap} pool with identifier ${datumParameters.PoolIdentifier}`);

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
                        swapInAmount = output.lovelaceBalance - BigInt(datumParameters.ScooperFee as number) - DEPOSIT_FEE;
                        swapInToken = 'lovelace';
                        swapOutToken = ! existingPool.tokenA
                            ? existingPool.tokenB
                            : existingPool.tokenA;
                    }

                    return resolve(
                        LiquidityPoolSwap.make(
                            Dex.SundaeSwap,
                            datumParameters.PoolIdentifier as string,
                            swapInToken,
                            swapOutToken,
                            Number(swapInAmount),
                            Number(datumParameters.MinReceive),
                            Number(datumParameters.ScooperFee),
                            datumParameters.SenderPubKeyHash as string,
                            (datumParameters.SenderStakingKeyHash ?? '') as string,
                            transaction.blockSlot,
                            transaction.hash,
                            output.index,
                            output.toAddress,
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
            });
    }

    /**
     * Check for ZAP orders in transaction.
     */
    protected zapOrders(transaction: Transaction): Promise<LiquidityPoolZap[]> {
        const promises: Promise<LiquidityPoolZap | undefined>[] = transaction.outputs.map((output: Utxo) => {
            return new Promise(async (resolve, reject) => {
                if (output.toAddress !== ORDER_CONTRACT_ADDRESS || ! output.datum) {
                    return resolve(undefined);
                }

                try {
                    const definitionField: DefinitionField = toDefinitionDatum(
                        Data.from(output.datum)
                    );
                    const builder: DefinitionBuilder = new DefinitionBuilder(zapDefinition);
                    const datumParameters: DatumParameters = builder.pullParameters(definitionField as DefinitionConstr);

                    // Impossible to know the swap out token unless we know the tokens in the pool
                    const existingPool: LiquidityPool | undefined = await this.liquidityPoolFromIdentifier(datumParameters.PoolIdentifier as string);

                    if (! existingPool) return reject(`Unable to find ${Dex.SundaeSwap} pool with identifier ${datumParameters.PoolIdentifier}`);

                    let swapInToken: Token | undefined;
                    let swapOutToken: Token | undefined;

                    if (output.assetBalances.length > 0) {
                        swapInToken = output.assetBalances[0].asset;
                        swapOutToken = tokensMatch(output.assetBalances[0].asset, existingPool.tokenA ?? 'lovelace')
                            ? existingPool.tokenB
                            : existingPool.tokenA;
                    } else {
                        swapInToken = 'lovelace';
                        swapOutToken = ! existingPool.tokenA
                            ? existingPool.tokenB
                            : existingPool.tokenA;
                    }


                    return resolve(
                        LiquidityPoolZap.make(
                            Dex.SundaeSwap,
                            datumParameters.PoolIdentifier as string,
                            swapInToken,
                            swapOutToken,
                            Number(datumParameters.DepositA),
                            undefined,
                            Number(datumParameters.ScooperFee),
                            datumParameters.ReceiverPubKeyHash as string,
                            '',
                            transaction.blockSlot,
                            transaction.hash,
                            output.index,
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
            });
    }

    /**
     * Check for updated liquidity pool states in transaction.
     */
    protected liquidityPoolStates(transaction: Transaction): LiquidityPoolState[] {
        return transaction.outputs.map((output: Utxo) => {
            if (output.toAddress !== POOL_CONTRACT_ADDRESS || ! output.datum) {
                return undefined;
            }

            const relevantAssets: AssetBalance[] = output.assetBalances.filter((assetBalance: AssetBalance) => {
                return ! assetBalance.asset.identifier().startsWith(LP_TOKEN_POLICY_ID);
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
                // 'lp' prefix
                lpToken.nameHex = '6c' + lpToken.nameHex;
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
                    Dex.SundaeSwap,
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
                    ((Number(datumParameters.LpFeeNumerator)) / Number(datumParameters.LpFeeDenominator)) * 100,
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
            if (output.toAddress !== ORDER_CONTRACT_ADDRESS || ! output.datum) {
                return undefined;
            }

            try {
                const definitionField: DefinitionField = toDefinitionDatum(
                    Data.from(output.datum)
                );
                const builder: DefinitionBuilder = new DefinitionBuilder(poolDepositDefinition);
                const datumParameters: DatumParameters = builder.pullParameters(definitionField as DefinitionConstr);

                return LiquidityPoolDeposit.make(
                    Dex.SundaeSwap,
                    datumParameters.PoolIdentifier as string,
                    output.assetBalances.length > 1
                        ? output.assetBalances[0].asset
                        : 'lovelace',
                    output.assetBalances.length > 1
                        ? output.assetBalances[1].asset
                        : output.assetBalances[0].asset,
                    Number(datumParameters.DepositA),
                    Number(datumParameters.DepositB),
                    undefined,
                    Number(datumParameters.ScooperFee),
                    datumParameters.SenderPubKeyHash as string,
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
            if (output.toAddress !== ORDER_CONTRACT_ADDRESS || ! output.datum) {
                return undefined;
            }

            try {
                const definitionField: DefinitionField = toDefinitionDatum(
                    Data.from(output.datum)
                );
                const builder: DefinitionBuilder = new DefinitionBuilder(poolWithdrawDefinition);
                const datumParameters: DatumParameters = builder.pullParameters(definitionField as DefinitionConstr);

                return LiquidityPoolWithdraw.make(
                    Dex.SundaeSwap,
                    datumParameters.PoolIdentifier as string,
                    output.assetBalances[0].asset,
                    Number(output.assetBalances[0].quantity),
                    undefined,
                    undefined,
                    Number(datumParameters.ScooperFee),
                    datumParameters.SenderPubKeyHash as string,
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
