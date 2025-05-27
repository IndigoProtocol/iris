import {
  AddressDetails,
  Data,
  getAddressDetails,
} from '@lucid-evolution/lucid';
import { DefinitionBuilder } from '../DefinitionBuilder';
import { BIPS, DatumParameterKey, Dex, SwapOrderType } from '../constants';
import { Asset, Token } from '../db/entities/Asset';
import { LiquidityPoolDeposit } from '../db/entities/LiquidityPoolDeposit';
import { LiquidityPoolState } from '../db/entities/LiquidityPoolState';
import { LiquidityPoolSwap } from '../db/entities/LiquidityPoolSwap';
import { LiquidityPoolWithdraw } from '../db/entities/LiquidityPoolWithdraw';
import { OperationStatus } from '../db/entities/OperationStatus';
import { OrderBookMatch } from '../db/entities/OrderBookMatch';
import { OrderBookOrder } from '../db/entities/OrderBookOrder';
import {
  AmmDexOperation,
  AssetBalance,
  DatumParameters,
  DefinitionConstr,
  DefinitionField,
  HybridOperation,
  Transaction,
  Utxo,
} from '../types';
import { stringify, toDefinitionDatum, tokensMatch } from '../utils';
import { BaseHybridDexAnalyzer } from './BaseHybridDexAnalyzer';
import poolDefinition from './definitions/wingriderstable/pool';
import poolDepositDefinition from './definitions/muesliswap/pool-deposit';
import poolWithdrawDefinition from './definitions/muesliswap/pool-withdraw';
import swapDefinition from './definitions/muesliswap/swap';
import { BaseAmmDexAnalyzer } from './BaseAmmDexAnalyzer';

// TODO: Update with the correct script hash
const POOL_NFT_POLICY_ID: string =
  '6fdc63a1d71dc2c65502b79baae7fb543185702b12c3c5fb639ed737';
const MIN_POOL_ADA = 2000000n;
const MAX_INT: bigint = 9_223_372_036_854_775_807n;
const FEE_PERCENT: number = 0.35;
const STABLE_POOL_SCRIPT_HASH =
  '946ae228430f2fc64aa8b3acb910ee27e9b3e47aa8f925fac27834a1';
const BATCHER_FEE = 200000n; // Batcher fee for stable pools

export class WingRidersStableAnalyzer extends BaseAmmDexAnalyzer {
  public startSlot = 133880255;
  public async analyzeTransaction(
    transaction: Transaction
  ): Promise<AmmDexOperation[]> {
    console.log(
      `Analyzing WingRiders Stable transaction ${transaction.hash} at slot ${transaction.blockSlot}`
    );
    const a = await Promise.all([
      this.liquidityPoolStates(transaction),
      this.swapOrders(transaction),
    ]).then((operations: AmmDexOperation[][]) => operations.flat(2));
    console.log('find transaction ', a);
    return a;
  }

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
        if (
          getAddressDetails(output.toAddress).paymentCredential?.hash !==
          STABLE_POOL_SCRIPT_HASH
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
          const projectTreasuryA = BigInt(
            datumParameters.ProjectTreasuryA as number
          );
          const projectTreasuryB = BigInt(
            datumParameters.ProjectTreasuryB as number
          );
          const reserveTreasuryA = BigInt(
            datumParameters.ReserveTreasuryA as number
          );
          const reserveTreasuryB = BigInt(
            datumParameters.ReserveTreasuryB as number
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
            Dex.WingRidersStable,
            output.toAddress,
            lpTokenAssetBalance.asset.identifier(),
            tokenA,
            tokenB,
            lpTokenAssetBalance.asset,
            String(
              tokenA === 'lovelace'
                ? reserveA -
                    treasuryA -
                    projectTreasuryA -
                    reserveTreasuryA -
                    MIN_POOL_ADA
                : reserveA - treasuryA - projectTreasuryA - reserveTreasuryA
            ),
            String(
              tokenB === 'lovelace'
                ? reserveB -
                    treasuryB -
                    projectTreasuryB -
                    reserveTreasuryB -
                    MIN_POOL_ADA
                : reserveB - treasuryB - projectTreasuryB - reserveTreasuryB
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
              batcherFee: String(datumParameters.AgentFee ?? 0),
              feeDenominator: Number(datumParameters.FeeBasis ?? 0),
              minAda: MIN_POOL_ADA.toString(),
              feeNumerator:
                Number(datumParameters.SwapFee ?? 0) +
                Number(datumParameters.ProtocolFee ?? 0) +
                Number(datumParameters.ProjectFeeInBasis ?? 0) +
                Number(datumParameters.ReserveFeeInBasis ?? 0),
              ReserveFeeInBasis: Number(datumParameters.ReserveFeeInBasis ?? 0),
              ProtocolFee: Number(datumParameters.ProtocolFee ?? 0),
              ProjectFeeInBasis: Number(datumParameters.ProjectFeeInBasis ?? 0),
              SwapFee: Number(datumParameters.SwapFee ?? 0),
              AgentFee: Number(datumParameters.AgentFee ?? 0),
              ParameterD: Number(datumParameters.ParameterD ?? 0),
              AScale: Number(datumParameters.AScale ?? 0),
              BScale: Number(datumParameters.BScale ?? 0),
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
          STABLE_POOL_SCRIPT_HASH !== addressDetails.paymentCredential?.hash
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
            swapInAmount =
              output.lovelaceBalance -
              BATCHER_FEE -
              BigInt(datumParameters.Deposit as string);
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
            Dex.WingRidersV2,
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

  protected depositOrders(
    transaction: Transaction
  ): Promise<LiquidityPoolDeposit[]> | LiquidityPoolDeposit[] {
    return Promise.resolve([]);
  }

  protected withdrawOrders(
    transaction: Transaction
  ): Promise<LiquidityPoolWithdraw[]> | LiquidityPoolWithdraw[] {
    return Promise.resolve([]);
  }
}
