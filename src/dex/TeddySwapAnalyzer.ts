import {
  AddressDetails,
  Data,
  getAddressDetails,
} from '@lucid-evolution/lucid';
import { Dex, SwapOrderType } from '../constants';
import { Asset, Token } from '../db/entities/Asset';
import { LiquidityPoolDeposit } from '../db/entities/LiquidityPoolDeposit';
import { LiquidityPoolState } from '../db/entities/LiquidityPoolState';
import { LiquidityPoolSwap } from '../db/entities/LiquidityPoolSwap';
import { LiquidityPoolWithdraw } from '../db/entities/LiquidityPoolWithdraw';
import { OperationStatus } from '../db/entities/OperationStatus';
import { DefinitionBuilder } from '../DefinitionBuilder';
import {
  AmmDexOperation,
  AssetBalance,
  DatumParameters,
  DefinitionConstr,
  DefinitionField,
  Transaction,
  Utxo,
} from '../types';
import { toDefinitionDatum } from '../utils';
import { BaseAmmDexAnalyzer } from './BaseAmmDexAnalyzer';
import poolDefinition from './definitions/teddyswap/pool';
import poolDepositDefinition from './definitions/teddyswap/pool-deposit';
import poolWithdrawDefinition from './definitions/teddyswap/pool-withdraw';
import swapDefinition from './definitions/teddyswap/swap';

/**
 * TeddySwap constants.
 */
const SWAP_CONTRACT_ADDRESS: string =
  'addr1z99tz7hungv6furtdl3zn72sree86wtghlcr4jc637r2eadkp2avt5gp297dnxhxcmy6kkptepsr5pa409qa7gf8stzs0706a3';
const DEPOSIT_CONTRACT_ADDRESS: string =
  'addr1zyx8pkqywyu3qd2x7rnk4tlvlhcxvl9m897gjah5pt50evakp2avt5gp297dnxhxcmy6kkptepsr5pa409qa7gf8stzs6z6f9z';
const WITHDRAW_CONTRACT_ADDRESS: string =
  'addr1zx4ktrt9k4chhurm6wc6ntfg6vwpswq3hwjqw6h2e607hr4kp2avt5gp297dnxhxcmy6kkptepsr5pa409qa7gf8stzs5z3nsm';
const POOL_PUB_KEY: string =
  '28bbd1f7aebb3bc59e13597f333aeefb8f5ab78eda962de1d605b388';
const MAX_INT: bigint = 9_223_372_036_854_775_807n;
const CANCEL_ORDER_DATUM: string = 'd8799f00000001ff';
const CANCEL_REFERENCE_TX_HASHES: string[] = [
  'fb6906c2bc39777086036f9c46c297e9d8a41ede154b398d85245a2549b4bf04',
];

export class TeddySwapAnalyzer extends BaseAmmDexAnalyzer {
  public startSlot: number = 109078697;

  /**
   * Analyze transaction for possible DEX operations.
   */
  public async analyzeTransaction(
    transaction: Transaction
  ): Promise<AmmDexOperation[]> {
    return Promise.all([this.liquidityPoolStates(transaction)]).then(
      (operations: AmmDexOperation[][]) => operations.flat(2)
    );
  }

  /**
   * Check for swap orders in transaction.
   */
  protected swapOrders(transaction: Transaction): LiquidityPoolSwap[] {
    return transaction.outputs
      .map((output: Utxo) => {
        if (output.toAddress !== SWAP_CONTRACT_ADDRESS || !output.datum) {
          return undefined;
        }

        try {
          const definitionField: DefinitionField = toDefinitionDatum(
            Data.from(output.datum)
          );
          const builder: DefinitionBuilder = new DefinitionBuilder(
            swapDefinition
          );
          const datumParameters: DatumParameters = builder.pullParameters(
            definitionField as DefinitionConstr
          );

          let swapInToken: Token =
            datumParameters.SwapInTokenPolicyId === ''
              ? 'lovelace'
              : new Asset(
                  datumParameters.SwapInTokenPolicyId as string,
                  datumParameters.SwapInTokenAssetName as string
                );
          let swapOutToken: Token =
            datumParameters.SwapOutTokenPolicyId === ''
              ? 'lovelace'
              : new Asset(
                  datumParameters.SwapOutTokenPolicyId as string,
                  datumParameters.SwapOutTokenAssetName as string
                );
          let swapInAmount: bigint = BigInt(
            datumParameters.SwapInAmount as number
          );

          return LiquidityPoolSwap.make(
            Dex.TeddySwap,
            undefined,
            swapInToken,
            swapOutToken,
            Number(swapInAmount),
            Number(datumParameters.MinReceive),
            Number(
              swapInToken === 'lovelace'
                ? output.lovelaceBalance - swapInAmount
                : output.lovelaceBalance
            ),
            datumParameters.SenderPubKeyHash as string,
            (datumParameters.SenderStakingKeyHash ?? '') as string,
            transaction.blockSlot,
            transaction.hash,
            output.index,
            output.toAddress,
            SwapOrderType.Instant,
            transaction
          );
        } catch (e) {
          return undefined;
        }
      })
      .filter(
        (operation: LiquidityPoolSwap | undefined) => operation !== undefined
      ) as LiquidityPoolSwap[];
  }

  /**
   * Check for updated liquidity pool states in transaction.
   */
  protected liquidityPoolStates(
    transaction: Transaction
  ): LiquidityPoolState[] {
    return transaction.outputs
      .map((output: Utxo) => {
        const addressDetails: AddressDetails = getAddressDetails(
          output.toAddress
        );

        // Other addresses have pools, but are used for testing
        if (
          !addressDetails.paymentCredential ||
          addressDetails.paymentCredential.hash !== POOL_PUB_KEY ||
          !output.datum
        ) {
          return undefined;
        }

        try {
          const definitionField: DefinitionField = toDefinitionDatum(
            Data.from(output.datum)
          );
          const builder: DefinitionBuilder = new DefinitionBuilder(
            poolDefinition
          );
          const datumParameters: DatumParameters = builder.pullParameters(
            definitionField as DefinitionConstr
          );

          const tokenA: Token =
            datumParameters.PoolAssetAPolicyId === ''
              ? 'lovelace'
              : new Asset(
                  datumParameters.PoolAssetAPolicyId as string,
                  datumParameters.PoolAssetAAssetName as string
                );
          const tokenB: Token =
            datumParameters.PoolAssetBPolicyId === ''
              ? 'lovelace'
              : new Asset(
                  datumParameters.PoolAssetBPolicyId as string,
                  datumParameters.PoolAssetBAssetName as string
                );
          const lpToken: Asset = new Asset(
            datumParameters.LpTokenPolicyId as string,
            datumParameters.LpTokenAssetName as string
          );
          const poolNft: Asset | undefined = new Asset(
            datumParameters.TokenPolicyId as string,
            datumParameters.TokenAssetName as string
          );
          const lpTokenAssetBalance: AssetBalance | undefined =
            output.assetBalances.find((balance: AssetBalance) => {
              return balance.asset.identifier() === lpToken.identifier();
            });

          if (!lpTokenAssetBalance || !poolNft) return undefined;

          const reserveA: bigint =
            tokenA === 'lovelace'
              ? output.lovelaceBalance
              : (output.assetBalances.find(
                  (balance: AssetBalance) =>
                    balance.asset.identifier() === tokenA.identifier()
                )?.quantity ?? 0n);
          const reserveB: bigint =
            tokenB === 'lovelace'
              ? output.lovelaceBalance
              : (output.assetBalances.find(
                  (balance: AssetBalance) =>
                    balance.asset.identifier() === tokenB.identifier()
                )?.quantity ?? 0n);

          const possibleOperationStatuses: OperationStatus[] =
            this.spentOperationInputs(transaction);

          return LiquidityPoolState.make(
            Dex.TeddySwap,
            output.toAddress,
            lpTokenAssetBalance.asset.identifier(),
            tokenA,
            tokenB,
            lpToken,
            String(reserveA),
            String(reserveB),
            Number(MAX_INT - lpTokenAssetBalance.quantity),
            (1000 - Number(datumParameters.LpFee)) / 10,
            transaction.blockSlot,
            transaction.hash,
            possibleOperationStatuses,
            transaction.inputs,
            transaction.outputs.filter(
              (sibling: Utxo) => sibling.index !== output.index
            )
          );
        } catch (e) {
          return undefined;
        }
      })
      .flat()
      .filter(
        (operation: LiquidityPoolState | undefined) => operation !== undefined
      ) as LiquidityPoolState[];
  }

  /**
   * Check for liquidity pool deposits in transaction.
   */
  protected depositOrders(transaction: Transaction): LiquidityPoolDeposit[] {
    return transaction.outputs
      .map((output: Utxo) => {
        if (output.toAddress !== DEPOSIT_CONTRACT_ADDRESS || !output.datum) {
          return undefined;
        }

        try {
          const definitionField: DefinitionField = toDefinitionDatum(
            Data.from(output.datum)
          );
          const builder: DefinitionBuilder = new DefinitionBuilder(
            poolDepositDefinition
          );
          const datumParameters: DatumParameters = builder.pullParameters(
            definitionField as DefinitionConstr
          );

          let depositAToken: Token =
            output.assetBalances.length > 1
              ? output.assetBalances[0].asset
              : 'lovelace';
          let depositBToken: Token =
            depositAToken === 'lovelace'
              ? output.assetBalances[0].asset
              : output.assetBalances[1].asset;

          return LiquidityPoolDeposit.make(
            Dex.TeddySwap,
            undefined,
            depositAToken,
            depositBToken,
            Number(
              depositAToken === 'lovelace'
                ? output.lovelaceBalance -
                    BigInt(datumParameters.ExecutionFee as number) -
                    BigInt(datumParameters.Deposit as number)
                : output.assetBalances[0].quantity
            ),
            Number(
              depositAToken === 'lovelace'
                ? output.assetBalances[0].quantity
                : output.assetBalances[1].quantity
            ),
            undefined,
            Number(datumParameters.ExecutionFee),
            datumParameters.SenderPubKeyHash as string,
            (datumParameters.SenderStakingKeyHash ?? '') as string,
            transaction.blockSlot,
            transaction.hash,
            output.index,
            transaction
          );
        } catch (e) {
          return undefined;
        }
      })
      .filter(
        (operation: LiquidityPoolDeposit | undefined) => operation !== undefined
      ) as LiquidityPoolDeposit[];
  }

  /**
   * Check for liquidity pool withdraws in transaction.
   */
  protected withdrawOrders(transaction: Transaction): LiquidityPoolWithdraw[] {
    return transaction.outputs
      .map((output: Utxo) => {
        if (output.toAddress !== WITHDRAW_CONTRACT_ADDRESS || !output.datum) {
          return undefined;
        }

        try {
          const definitionField: DefinitionField = toDefinitionDatum(
            Data.from(output.datum)
          );
          const builder: DefinitionBuilder = new DefinitionBuilder(
            poolWithdrawDefinition
          );
          const datumParameters: DatumParameters = builder.pullParameters(
            definitionField as DefinitionConstr
          );

          return LiquidityPoolWithdraw.make(
            Dex.TeddySwap,
            undefined,
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
            transaction
          );
        } catch (e) {
          return undefined;
        }
      })
      .filter(
        (operation: LiquidityPoolWithdraw | undefined) =>
          operation !== undefined
      ) as LiquidityPoolWithdraw[];
  }
}
