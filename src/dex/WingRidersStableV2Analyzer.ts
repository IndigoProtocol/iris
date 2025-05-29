import { Data, getAddressDetails } from '@lucid-evolution/lucid';
import { DefinitionBuilder } from '../DefinitionBuilder';
import { Dex } from '../constants';
import { Asset, Token } from '../db/entities/Asset';
import { LiquidityPoolDeposit } from '../db/entities/LiquidityPoolDeposit';
import { LiquidityPoolState } from '../db/entities/LiquidityPoolState';
import { LiquidityPoolSwap } from '../db/entities/LiquidityPoolSwap';
import { LiquidityPoolWithdraw } from '../db/entities/LiquidityPoolWithdraw';
import { OperationStatus } from '../db/entities/OperationStatus';
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
import poolDefinition from './definitions/wingriders-stable-v2/pool';
import { BaseAmmDexAnalyzer } from './BaseAmmDexAnalyzer';

const POOL_NFT_POLICY_ID: string =
  '6fdc63a1d71dc2c65502b79baae7fb543185702b12c3c5fb639ed737';
const MIN_POOL_ADA = 2000000n;
const MAX_INT: bigint = 9_223_372_036_854_775_807n;
const STABLE_POOL_SCRIPT_HASH =
  '946ae228430f2fc64aa8b3acb910ee27e9b3e47aa8f925fac27834a1';

export class WingRidersStableV2Analyzer extends BaseAmmDexAnalyzer {
  public startSlot = 133880255;
  public analyzeTransaction(
    transaction: Transaction
  ): Promise<AmmDexOperation[]> {
    return Promise.all([
      this.liquidityPoolStates(transaction),
      this.swapOrders(transaction),
    ]).then((operations: AmmDexOperation[][]) => operations.flat(2));
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

          const balanceA =
            tokenA === 'lovelace'
              ? reserveA -
                treasuryA -
                projectTreasuryA -
                reserveTreasuryA -
                MIN_POOL_ADA
              : reserveA - treasuryA - projectTreasuryA - reserveTreasuryA;

          const balanceB =
            tokenB === 'lovelace'
              ? reserveB -
                treasuryB -
                projectTreasuryB -
                reserveTreasuryB -
                MIN_POOL_ADA
              : reserveB - treasuryB - projectTreasuryB - reserveTreasuryB;

          const otherFeeInBasis =
            BigInt(datumParameters.ProtocolFeeInBasis ?? 0) +
            BigInt(datumParameters.ProjectFeeInBasis ?? 0) +
            BigInt(datumParameters.ReserveFeeInBasis ?? 0);

          const feeNumerator =
            BigInt(datumParameters.SwapFeeInBasis ?? 0) + otherFeeInBasis;

          return LiquidityPoolState.make(
            Dex.WingRidersStableV2,
            output.toAddress,
            lpTokenAssetBalance.asset.identifier(),
            tokenA,
            tokenB,
            lpTokenAssetBalance.asset,
            String(balanceA),
            String(balanceB),
            Number(MAX_INT - lpTokenAssetBalance.quantity),
            (Number(feeNumerator) * 100) /
              Number(datumParameters.FeeBasis ?? 0),
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
              feeNumerator: Number(feeNumerator),
              SwapFeeInBasis: Number(datumParameters.SwapFeeInBasis ?? 0),
              OtherFeeInBasis: Number(otherFeeInBasis),
              AgentFee: Number(datumParameters.AgentFee ?? 0),
              InvariantD: String(datumParameters.InvariantD ?? 0),
              Multiplier0: String(datumParameters.Multiplier0 ?? 0),
              Multiplier1: String(datumParameters.Multiplier1 ?? 0),
              Balance0: String(balanceA),
              Balance1: String(balanceB),
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
    return [];
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
