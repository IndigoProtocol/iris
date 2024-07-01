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
import { DefinitionBuilder } from '../DefinitionBuilder';
import { toDefinitionDatum, tokenId } from '../utils';
import { Data } from 'lucid-cardano';
import { Dex, SwapOrderType } from '../constants';
import swapDefinition from './definitions/minswap/swap';
import zapDefinition from './definitions/minswap/zap';
import poolDefinition from './definitions/minswap/pool';
import poolDepositDefinition from './definitions/minswap/pool-deposit';
import poolWithdrawDefinition from './definitions/minswap/pool-withdraw';
import { Asset, Token } from '../db/entities/Asset';
import { LiquidityPoolSwap } from '../db/entities/LiquidityPoolSwap';
import { LiquidityPoolZap } from '../db/entities/LiquidityPoolZap';
import { LiquidityPoolState } from '../db/entities/LiquidityPoolState';
import { LiquidityPoolDeposit } from '../db/entities/LiquidityPoolDeposit';
import { LiquidityPoolWithdraw } from '../db/entities/LiquidityPoolWithdraw';
import { OperationStatus } from '../db/entities/OperationStatus';

/**
 * Minswap constants.
 */
const FEE_PERCENT: number = 0.3;
const ORDER_V1_CONTRACT_ADDRESS: string = 'addr1wyx22z2s4kasd3w976pnjf9xdty88epjqfvgkmfnscpd0rg3z8y6v';
const ORDER_V2_CONTRACT_ADDRESS: string = 'addr1wxn9efv2f6w82hagxqtn62ju4m293tqvw0uhmdl64ch8uwc0h43gt';
const ORDER_V3_CONTRACT_ADDRESS: string = 'addr1zxn9efv2f6w82hagxqtn62ju4m293tqvw0uhmdl64ch8uw6j2c79gy9l76sdg0xwhd7r0c0kna0tycz4y5s6mlenh8pq6s3z70';
const POOL_V1_NFT_POLICY_ID: string = '5178cc70a14405d3248e415d1a120c61d2aa74b4cee716d475b1495e';
const POOL_V2_NFT_POLICY_ID: string = '0be55d262b29f564998ff81efe21bdc0022621c12f15af08d0f2ddb1';
const FACTORY_V1_POLICY_ID: string = '3f6092645942a54a75186b25e0975b79e1f50895ad958b42015eb6d2';
const FACTORY_V2_POLICY_ID: string = '13aa2accf2e1561723aa26871e071fdf32c867cff7e7d50ad470d62f';
const LP_TOKEN_V1_POLICY_ID: string = 'e0baa1f0887a766daf5196f92c88728e356e71255c5ad00866607484';
const LP_TOKEN_V2_POLICY_ID: string = 'e4214b7cce62ac6fbba385d164df48e157eae5863521b4b67ca71d86';
const CANCEL_ORDER_DATUM: string = 'd87a80';

export class MinswapAnalyzer extends BaseAmmDexAnalyzer {

    public startSlot: number = 56553560;

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
            this.cancelledOperationInputs(transaction, [ORDER_V1_CONTRACT_ADDRESS, ORDER_V2_CONTRACT_ADDRESS, ORDER_V3_CONTRACT_ADDRESS], CANCEL_ORDER_DATUM),
        ]).then((operations: AmmDexOperation[][]) => operations.flat());
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
                            - BigInt(datumParameters.BatcherFee as number)
                            - BigInt(datumParameters.DepositFee as number);
                    }
                }

                return LiquidityPoolSwap.make(
                    Dex.Minswap,
                    undefined,
                    swapInToken,
                    swapOutToken,
                    Number(swapInAmount),
                    Number(datumParameters.MinReceive),
                    Number(datumParameters.BatcherFee),
                    datumParameters.ReceiverPubKeyHash as string,
                    (datumParameters.ReceiverStakingKeyHash ?? '') as string,
                    transaction.blockSlot,
                    transaction.hash,
                    output.index,
                    output.toAddress,
                    SwapOrderType.Instant,
                    transaction,
                );
            } catch (e) {
                return undefined;
            }
        }).filter((operation: LiquidityPoolSwap | undefined) => operation !== undefined) as LiquidityPoolSwap[];
    }

    /**
     * Check for ZAP orders in transaction.
     */
    protected zapOrders(transaction: Transaction): Promise<LiquidityPoolZap[]> {
        const promises: Promise<LiquidityPoolZap | undefined>[] = transaction.outputs.map((output: Utxo) => {
            return new Promise(async (resolve) => {
                if (! [ORDER_V1_CONTRACT_ADDRESS, ORDER_V2_CONTRACT_ADDRESS, ORDER_V3_CONTRACT_ADDRESS].includes(output.toAddress) || ! output.datum) {
                    return resolve(undefined);
                }

                try {
                    const definitionField: DefinitionField = toDefinitionDatum(
                        Data.from(output.datum)
                    );
                    const builder: DefinitionBuilder = new DefinitionBuilder(zapDefinition);
                    const datumParameters: DatumParameters = builder.pullParameters(definitionField as DefinitionConstr);

                    const swapInToken: Token = output.assetBalances.length > 0
                        ? output.assetBalances[0].asset
                        : 'lovelace';
                    const forToken: Token = datumParameters.TokenPolicyId === ''
                        ? 'lovelace'
                        : new Asset(datumParameters.TokenPolicyId as string, datumParameters.TokenAssetName as string);

                    return resolve(
                        LiquidityPoolZap.make(
                            Dex.Minswap,
                            undefined,
                            swapInToken,
                            forToken,
                            Number(swapInToken === 'lovelace'
                                ? (output.lovelaceBalance
                                    - BigInt(datumParameters.BatcherFee as number)
                                    - BigInt(datumParameters.DepositFee as number))
                                : output.assetBalances[0].quantity),
                            Number(datumParameters.MinReceive),
                            Number(datumParameters.BatcherFee),
                            datumParameters.ReceiverPubKeyHash as string,
                            (datumParameters.ReceiverStakingKeyHash ?? '') as string,
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
            });
    }

    /**
     * Check for updated liquidity pool states in transaction.
     */
    protected liquidityPoolStates(transaction: Transaction): LiquidityPoolState[] {
        // todo: pool datum has fee sharing. DefinitionBuilder will not pick up state if that is provided
        return transaction.outputs.map((output: Utxo) => {
            // Check if pool output is valid
            const hasFactoryNft: boolean = output.assetBalances.some((balance: AssetBalance) => {
                return [FACTORY_V1_POLICY_ID, FACTORY_V2_POLICY_ID].includes(balance.asset.policyId)
            });
            if (! output.datum || ! hasFactoryNft) {
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
                    return [POOL_V1_NFT_POLICY_ID, POOL_V2_NFT_POLICY_ID].includes(balance.asset.policyId);
                })?.asset;

                if (! poolNft) return undefined;

                const lpToken: Asset = new Asset(
                    poolNft.policyId === POOL_V1_NFT_POLICY_ID ? LP_TOKEN_V1_POLICY_ID : LP_TOKEN_V2_POLICY_ID,
                    poolNft.nameHex
                );

                const reserveA: bigint = tokenA === 'lovelace'
                    ? output.lovelaceBalance
                    : output.assetBalances.find((balance: AssetBalance) =>  balance.asset.identifier() === tokenA.identifier())?.quantity ?? 0n;

                const reserveB: bigint = tokenB === 'lovelace'
                    ? output.lovelaceBalance
                    : output.assetBalances.find((balance: AssetBalance) =>  balance.asset.identifier() === tokenB.identifier())?.quantity ?? 0n;

                const possibleOperationStatuses: OperationStatus[] = this.spentOperationInputs(transaction);

                return LiquidityPoolState.make(
                    Dex.Minswap,
                    output.toAddress,
                    `${tokenId(tokenA)}.${tokenId(tokenB)}`,
                    tokenA,
                    tokenB,
                    lpToken,
                    Number(reserveA),
                    Number(reserveB),
                    Number(datumParameters.TotalLpTokens),
                    FEE_PERCENT,
                    transaction.blockSlot,
                    transaction.hash,
                    possibleOperationStatuses,
                    transaction.inputs,
                    transaction.outputs.filter((sibling: Utxo) => sibling.index !== output.index),
                );
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
            if (! [ORDER_V1_CONTRACT_ADDRESS, ORDER_V2_CONTRACT_ADDRESS, ORDER_V3_CONTRACT_ADDRESS].includes(output.toAddress) || ! output.datum) {
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
                    Dex.Minswap,
                    undefined,
                    depositAToken,
                    depositBToken,
                    Number(depositAToken === 'lovelace'
                        ? (output.lovelaceBalance - BigInt(datumParameters.BatcherFee as number))
                        : output.assetBalances[0].quantity),
                    Number(depositAToken === 'lovelace'
                        ? output.assetBalances[0].quantity
                        : output.assetBalances[1].quantity),
                    Number(datumParameters.MinReceive),
                    Number(datumParameters.BatcherFee),
                    datumParameters.ReceiverPubKeyHash as string,
                    (datumParameters.ReceiverStakingKeyHash ?? '') as string,
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
            if (! [ORDER_V1_CONTRACT_ADDRESS, ORDER_V2_CONTRACT_ADDRESS, ORDER_V3_CONTRACT_ADDRESS].includes(output.toAddress) || ! output.datum) {
                return undefined;
            }

            try {
                const definitionField: DefinitionField = toDefinitionDatum(
                    Data.from(output.datum)
                );
                const builder: DefinitionBuilder = new DefinitionBuilder(poolWithdrawDefinition);
                const datumParameters: DatumParameters = builder.pullParameters(definitionField as DefinitionConstr);

                const lpToken: Asset | undefined = output.assetBalances.find((assetBalance: AssetBalance) => {
                    return assetBalance.asset.policyId === LP_TOKEN_V1_POLICY_ID || assetBalance.asset.policyId === LP_TOKEN_V2_POLICY_ID;
                })?.asset;

                if (! lpToken) {
                    return undefined;
                }

                return LiquidityPoolWithdraw.make(
                    Dex.Minswap,
                    undefined,
                    lpToken,
                    Number(output.assetBalances[0].quantity),
                    Number(datumParameters.MinReceiveA),
                    Number(datumParameters.MinReceiveB),
                    Number(datumParameters.BatcherFee),
                    datumParameters.ReceiverPubKeyHash as string,
                    (datumParameters.ReceiverStakingKeyHash ?? '') as string,
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
