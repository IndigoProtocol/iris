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
import { toDefinitionDatum } from '../utils';
import { Data } from 'lucid-cardano';
import { Dex } from '../constants';
import swapDefinition from './definitions/spectrum/swap';
import poolDefinition from './definitions/spectrum/pool';
import poolDepositDefinition from './definitions/spectrum/pool-deposit';
import poolWithdrawDefinition from './definitions/spectrum/pool-withdraw';
import { Asset, Token } from '../db/entities/Asset';
import { LiquidityPoolSwap } from '../db/entities/LiquidityPoolSwap';
import { LiquidityPoolState } from '../db/entities/LiquidityPoolState';
import { LiquidityPoolDeposit } from '../db/entities/LiquidityPoolDeposit';
import { LiquidityPoolWithdraw } from '../db/entities/LiquidityPoolWithdraw';
import { OperationStatus } from '../db/entities/OperationStatus';

/**
 * Spectrum constants.
 */
const SWAP_CONTRACT_ADDRESS: string = 'addr1wynp362vmvr8jtc946d3a3utqgclfdl5y9d3kn849e359hsskr20n';
const POOL_V1_CONTRACT_ADDRESS: string = 'addr1x8nz307k3sr60gu0e47cmajssy4fmld7u493a4xztjrll0aj764lvrxdayh2ux30fl0ktuh27csgmpevdu89jlxppvrswgxsta';
const POOL_V2_CONTRACT_ADDRESS: string = 'addr1x94ec3t25egvhqy2n265xfhq882jxhkknurfe9ny4rl9k6dj764lvrxdayh2ux30fl0ktuh27csgmpevdu89jlxppvrst84slu';
const DEPOSIT_CONTRACT_ADDRESS: string = 'addr1wyr4uz0tp75fu8wrg6gm83t20aphuc9vt6n8kvu09ctkugqpsrmeh';
const WITHDRAW_CONTRACT_ADDRESS: string = 'addr1wxpa5704x8qel88ympf4natfdzn59nc9esj7609y3sczmmsasees8';
const MAX_INT: bigint = 9_223_372_036_854_775_807n;
const CANCEL_ORDER_DATUM: string = 'd8799f00000001ff';

export class SpectrumAnalyzer extends BaseAmmDexAnalyzer {

    /**
     * Analyze transaction for possible DEX operations.
     */
    public async analyzeTransaction(transaction: Transaction): Promise<AmmDexOperation[]> {
        return Promise.all([
            this.liquidityPoolStates(transaction),
            this.swapOrders(transaction),
            this.depositOrders(transaction),
            this.withdrawOrders(transaction),
            this.cancelledOperationInputs(transaction, [SWAP_CONTRACT_ADDRESS, DEPOSIT_CONTRACT_ADDRESS, WITHDRAW_CONTRACT_ADDRESS], CANCEL_ORDER_DATUM),
        ]).then((operations: AmmDexOperation[][]) => operations.flat(2));
    }

    /**
     * Check for swap orders in transaction.
     */
    protected swapOrders(transaction: Transaction): LiquidityPoolSwap[] {
        return transaction.outputs.map((output: Utxo) => {
            if (output.toAddress !== SWAP_CONTRACT_ADDRESS || ! output.datum) {
                return undefined;
            }

            try {
                const definitionField: DefinitionField = toDefinitionDatum(
                    Data.from(output.datum)
                );
                const builder: DefinitionBuilder = new DefinitionBuilder(swapDefinition);
                const datumParameters: DatumParameters = builder.pullParameters(definitionField as DefinitionConstr);

                let swapInToken: Token = datumParameters.SwapInTokenPolicyId === ''
                    ? 'lovelace'
                    : new Asset(datumParameters.SwapInTokenPolicyId as string, datumParameters.SwapInTokenAssetName as string);
                let swapOutToken: Token = datumParameters.SwapOutTokenPolicyId === ''
                    ? 'lovelace'
                    : new Asset(datumParameters.SwapOutTokenPolicyId as string, datumParameters.SwapOutTokenAssetName as string);
                let swapInAmount: bigint = BigInt(datumParameters.SwapInAmount as number);

                return LiquidityPoolSwap.make(
                    Dex.Spectrum,
                    `${datumParameters.TokenPolicyId}${datumParameters.TokenAssetName}`,
                    swapInToken,
                    swapOutToken,
                    Number(swapInAmount),
                    Number(datumParameters.MinReceive),
                    Number(swapInToken === 'lovelace'
                        ? (output.lovelaceBalance - swapInAmount)
                        : output.lovelaceBalance),
                    datumParameters.SenderPubKeyHash as string,
                    (datumParameters.SenderStakingKeyHash ?? '') as string,
                    transaction.blockSlot,
                    transaction.hash,
                    output.index,
                    output.toAddress,
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
            // Other addresses have pools, but are used for testing
            if (! [POOL_V1_CONTRACT_ADDRESS, POOL_V2_CONTRACT_ADDRESS].includes(output.toAddress) || ! output.datum) {
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
                const lpToken: Asset = new Asset(datumParameters.LpTokenPolicyId as string, datumParameters.LpTokenAssetName as string);
                const poolNft: Asset | undefined = new Asset(datumParameters.TokenPolicyId as string, datumParameters.TokenAssetName as string);
                const lpTokenAssetBalance: AssetBalance | undefined = output.assetBalances.find((balance: AssetBalance) => {
                    return balance.asset.identifier() === lpToken.identifier();
                });

                if (! lpTokenAssetBalance || ! poolNft) return undefined;

                const reserveA: bigint = tokenA === 'lovelace'
                    ? output.lovelaceBalance
                    : output.assetBalances.find((balance: AssetBalance) =>  balance.asset.identifier() === tokenA.identifier())?.quantity ?? 0n;
                const reserveB: bigint = tokenB === 'lovelace'
                    ? output.lovelaceBalance
                    : output.assetBalances.find((balance: AssetBalance) =>  balance.asset.identifier() === tokenB.identifier())?.quantity ?? 0n;

                const possibleOperationStatuses: OperationStatus[] = this.spentOperationInputs(transaction);

                return LiquidityPoolState.make(
                    Dex.Spectrum,
                    output.toAddress,
                    poolNft.identifier(),
                    tokenA,
                    tokenB,
                    lpToken,
                    Number(reserveA),
                    Number(reserveB),
                    Number(MAX_INT - lpTokenAssetBalance.quantity),
                    (1000 - Number(datumParameters.LpFee)) / 10,
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
            if (output.toAddress !== DEPOSIT_CONTRACT_ADDRESS || ! output.datum) {
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
                    Dex.Spectrum,
                    `${datumParameters.TokenPolicyId}${datumParameters.TokenAssetName}`,
                    depositAToken,
                    depositBToken,
                    Number(depositAToken === 'lovelace'
                        ? (output.lovelaceBalance - BigInt(datumParameters.ExecutionFee as number) - BigInt(datumParameters.Deposit as number))
                        : output.assetBalances[0].quantity),
                    Number(depositAToken === 'lovelace'
                        ? output.assetBalances[0].quantity
                        : output.assetBalances[1].quantity),
                    undefined,
                    Number(datumParameters.ExecutionFee),
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
            if (output.toAddress !== WITHDRAW_CONTRACT_ADDRESS || ! output.datum) {
                return undefined;
            }

            try {
                const definitionField: DefinitionField = toDefinitionDatum(
                    Data.from(output.datum)
                );
                const builder: DefinitionBuilder = new DefinitionBuilder(poolWithdrawDefinition);
                const datumParameters: DatumParameters = builder.pullParameters(definitionField as DefinitionConstr);

                return LiquidityPoolWithdraw.make(
                    Dex.Spectrum,
                    `${datumParameters.TokenPolicyId}${datumParameters.TokenAssetName}`,
                    output.assetBalances[0].asset,
                    Number(output.assetBalances[0].quantity),
                    undefined,
                    undefined,
                    Number(datumParameters.ExecutionFee),
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
