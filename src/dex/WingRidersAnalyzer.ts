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
import { toDefinitionDatum, tokensMatch } from '../utils';
import { BaseAmmDexAnalyzer } from './BaseAmmDexAnalyzer';
import poolDefinition from './definitions/wingriders/pool';
import poolDepositDefinition from './definitions/wingriders/pool-deposit';
import poolWithdrawDefinition from './definitions/wingriders/pool-withdraw';
import swapDefinition from './definitions/wingriders/swap';

/**
 * WingRiders constants.
 */
const ORDER_SCRIPT_HASHES: string[] = [
  '86ae9eebd8b97944a45201e4aec1330a72291af2d071644bba015959',
  'c5e0385012d5f010b1dc7ab42ba632944052de232051ec6ce3bfd72e',
];
const POOL_NFT_POLICY_ID: string =
  '026a18d04a0c642759bb3d83b12e3344894e5c1c7b2aeb1a2113a570';
const MIN_POOL_ADA: bigint = 3_000_000n;
const MAX_INT: bigint = 9_223_372_036_854_775_807n;
const BATCHER_FEE: bigint = 2000000n;
const OIL_FEE: bigint = 2000000n;
const FEE_PERCENT: number = 0.35;
const CANCEL_ORDER_DATUM: string = 'd87a80';

export class WingRidersAnalyzer extends BaseAmmDexAnalyzer {
  public startSlot: number = 57274883;

  /**
   * Analyze transaction for possible DEX operations.
   */
  public async analyzeTransaction(
    transaction: Transaction
  ): Promise<AmmDexOperation[]> {
    return Promise.all([
      this.liquidityPoolStates(transaction),
      this.swapOrders(transaction),
      this.depositOrders(transaction),
      this.withdrawOrders(transaction),
      this.cancelledOperationInputs(
        transaction,
        ORDER_SCRIPT_HASHES,
        CANCEL_ORDER_DATUM
      ),
    ]).then((operations: AmmDexOperation[][]) => operations.flat(2));
  }

  /**
   * Check for swap orders in transaction.
   */
  protected swapOrders(transaction: Transaction): LiquidityPoolSwap[] {
    return transaction.outputs
      .map((output: Utxo) => {
        if (!output.datum) {
          return undefined;
        }

        const addressDetails: AddressDetails = getAddressDetails(
          output.toAddress
        );

        if (
          !ORDER_SCRIPT_HASHES.includes(
            addressDetails.paymentCredential?.hash ?? ''
          )
        ) {
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

          let swapInToken: Token | undefined;
          let swapOutToken: Token | undefined;
          let swapInAmount: bigint;

          const poolTokenA: Token =
            datumParameters.PoolAssetAPolicyId === ''
              ? 'lovelace'
              : new Asset(
                  datumParameters.PoolAssetAPolicyId as string,
                  datumParameters.PoolAssetAAssetName as string
                );
          const poolTokenB: Token =
            datumParameters.PoolAssetBPolicyId === ''
              ? 'lovelace'
              : new Asset(
                  datumParameters.PoolAssetBPolicyId as string,
                  datumParameters.PoolAssetBAssetName as string
                );

          if (output.assetBalances.length > 0) {
            swapInToken = output.assetBalances[0].asset;
            swapInAmount = output.assetBalances[0].quantity;
          } else {
            swapInToken = 'lovelace';
            swapInAmount = output.lovelaceBalance - BATCHER_FEE - OIL_FEE;
          }

          swapOutToken = tokensMatch(poolTokenA, swapInToken)
            ? poolTokenB
            : poolTokenA;

          // Filter out farming
          if (
            swapInToken instanceof Asset &&
            swapInToken.policyId === POOL_NFT_POLICY_ID
          ) {
            return undefined;
          }
          if (
            swapOutToken instanceof Asset &&
            swapOutToken.policyId === POOL_NFT_POLICY_ID
          ) {
            return undefined;
          }

          return LiquidityPoolSwap.make(
            Dex.WingRiders,
            undefined,
            swapInToken,
            swapOutToken,
            Number(swapInAmount),
            Number(datumParameters.MinReceive),
            Number(BATCHER_FEE),
            datumParameters.ReceiverPubKeyHash as string,
            (datumParameters.ReceiverStakingKeyHash ?? '') as string,
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
        // Check if pool output is valid
        const hasPoolNft: boolean = output.assetBalances.some(
          (balance: AssetBalance) =>
            balance.asset.identifier() === `${POOL_NFT_POLICY_ID}4c`
        );
        if (!hasPoolNft || !output.datum) {
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

          let tokenA: Token =
            datumParameters.PoolAssetAPolicyId === ''
              ? 'lovelace'
              : new Asset(
                  datumParameters.PoolAssetAPolicyId as string,
                  datumParameters.PoolAssetAAssetName as string
                );
          let tokenB: Token =
            datumParameters.PoolAssetBPolicyId === ''
              ? 'lovelace'
              : new Asset(
                  datumParameters.PoolAssetBPolicyId as string,
                  datumParameters.PoolAssetBAssetName as string
                );
          const lpTokenAssetBalance: AssetBalance | undefined =
            output.assetBalances.find((balance: AssetBalance) => {
              return (
                balance.asset.policyId === POOL_NFT_POLICY_ID &&
                balance.asset.nameHex !== '4c'
              );
            });

          if (!lpTokenAssetBalance) return undefined;

          // Filter out farming
          if (
            tokenA instanceof Asset &&
            tokenA.policyId === POOL_NFT_POLICY_ID
          ) {
            return undefined;
          }
          if (
            tokenB instanceof Asset &&
            tokenB.policyId === POOL_NFT_POLICY_ID
          ) {
            return undefined;
          }

          const treasuryA: bigint = BigInt(
            datumParameters.PoolAssetATreasury as number
          );
          const treasuryB: bigint = BigInt(
            datumParameters.PoolAssetBTreasury as number
          );
          const reserveA: bigint | undefined =
            tokenA === 'lovelace'
              ? output.lovelaceBalance
              : output.assetBalances.find((balance: AssetBalance) =>
                  tokensMatch(tokenA, balance.asset)
                )?.quantity;
          const reserveB: bigint | undefined =
            tokenB === 'lovelace'
              ? output.lovelaceBalance
              : output.assetBalances.find((balance: AssetBalance) =>
                  tokensMatch(tokenB, balance.asset)
                )?.quantity;

          // Reserves possibly zero
          if (reserveA === undefined || reserveB === undefined)
            return undefined;

          const possibleOperationStatuses: OperationStatus[] =
            this.spentOperationInputs(transaction);

          return LiquidityPoolState.make(
            Dex.WingRiders,
            output.toAddress,
            lpTokenAssetBalance.asset.identifier(),
            tokenA,
            tokenB,
            lpTokenAssetBalance.asset,
            String(
              tokenA === 'lovelace'
                ? reserveA - treasuryA - MIN_POOL_ADA < 1_000_000n
                  ? reserveA - treasuryA - MIN_POOL_ADA
                  : reserveA - treasuryA
                : reserveA
            ),
            String(
              tokenB === 'lovelace'
                ? reserveB - treasuryB - MIN_POOL_ADA < 1_000_000n
                  ? reserveB - treasuryB - MIN_POOL_ADA
                  : reserveB - treasuryB
                : reserveB
            ),
            Number(MAX_INT - lpTokenAssetBalance.quantity),
            FEE_PERCENT,
            transaction.blockSlot,
            transaction.hash,
            possibleOperationStatuses,
            transaction.inputs,
            transaction.outputs.filter(
              (sibling: Utxo) => sibling.index !== output.index
            ),
            {
              txHash: transaction.hash,
              batcherFee: BATCHER_FEE.toString(),
              feeDenominator: 10_000,
              feeNumerator: FEE_PERCENT * 100,
              minAda: MIN_POOL_ADA.toString(),
            }
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
        if (!output.datum) {
          return undefined;
        }

        const addressDetails: AddressDetails = getAddressDetails(
          output.toAddress
        );

        if (
          !ORDER_SCRIPT_HASHES.includes(
            addressDetails.paymentCredential?.hash ?? ''
          )
        ) {
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

          // Filter out farming
          if (
            depositAToken instanceof Asset &&
            depositAToken.policyId === POOL_NFT_POLICY_ID
          ) {
            return undefined;
          }
          if (depositBToken.policyId === POOL_NFT_POLICY_ID) {
            return undefined;
          }

          return LiquidityPoolDeposit.make(
            Dex.WingRiders,
            undefined,
            depositAToken,
            depositBToken,
            Number(
              depositAToken === 'lovelace'
                ? output.lovelaceBalance - BATCHER_FEE - OIL_FEE
                : output.assetBalances[0].quantity
            ),
            Number(
              depositAToken === 'lovelace'
                ? output.assetBalances[0].quantity
                : output.assetBalances[1].quantity
            ),
            Number(datumParameters.MinReceive),
            Number(BATCHER_FEE),
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
        if (!output.datum) {
          return undefined;
        }

        const addressDetails: AddressDetails = getAddressDetails(
          output.toAddress
        );

        if (
          !ORDER_SCRIPT_HASHES.includes(
            addressDetails.paymentCredential?.hash ?? ''
          ) &&
          output.toAddress
        ) {
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

          if (
            datumParameters.PoolAssetAPolicyId === POOL_NFT_POLICY_ID ||
            datumParameters.PoolAssetBPolicyId === POOL_NFT_POLICY_ID
          ) {
            return undefined;
          }

          return LiquidityPoolWithdraw.make(
            Dex.WingRiders,
            undefined,
            output.assetBalances[0].asset,
            Number(output.assetBalances[0].quantity),
            Number(datumParameters.MinReceiveA),
            Number(datumParameters.MinReceiveB),
            Number(BATCHER_FEE),
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
