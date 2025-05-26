import { Data } from '@lucid-evolution/lucid';
import { Dex } from '../constants';
import { Asset, Token } from '../db/entities/Asset';
import { LiquidityPoolDeposit } from '../db/entities/LiquidityPoolDeposit';
import { LiquidityPoolState } from '../db/entities/LiquidityPoolState';
import { LiquidityPoolSwap } from '../db/entities/LiquidityPoolSwap';
import { LiquidityPoolWithdraw } from '../db/entities/LiquidityPoolWithdraw';
import { LiquidityPoolZap } from '../db/entities/LiquidityPoolZap';
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
import { toDefinitionDatum, tokenId } from '../utils';
import { BaseAmmDexAnalyzer } from './BaseAmmDexAnalyzer';
import poolDefinition from './definitions/minswap/pool';

/**
 * Minswap constants.
 */
const FEE_PERCENT: number = 0.3;
const POOL_V1_NFT_POLICY_ID: string =
  '5178cc70a14405d3248e415d1a120c61d2aa74b4cee716d475b1495e';
const POOL_V2_NFT_POLICY_ID: string =
  '0be55d262b29f564998ff81efe21bdc0022621c12f15af08d0f2ddb1';
const FACTORY_V1_POLICY_ID: string =
  '3f6092645942a54a75186b25e0975b79e1f50895ad958b42015eb6d2';
const FACTORY_V2_POLICY_ID: string =
  '13aa2accf2e1561723aa26871e071fdf32c867cff7e7d50ad470d62f';
const LP_TOKEN_V1_POLICY_ID: string =
  'e0baa1f0887a766daf5196f92c88728e356e71255c5ad00866607484';
const LP_TOKEN_V2_POLICY_ID: string =
  'e4214b7cce62ac6fbba385d164df48e157eae5863521b4b67ca71d86';
const MIN_ADA = 0n;
const BATCHER_FEE = 2_000_000n;
const FEE_NUMERATOR = 30;
const FEE_DENOMINATOR = 10_000;

export class MinswapStableAnalyzer extends BaseAmmDexAnalyzer {
  public startSlot: number = 56553560;

  /**
   * Analyze transaction for possible DEX operations.
   */
  public async analyzeTransaction(
    transaction: Transaction
  ): Promise<AmmDexOperation[]> {
    return Promise.all([this.liquidityPoolStates(transaction)]).then(
      (operations: AmmDexOperation[][]) => operations.flat()
    );
  }

  /**
   * Check for swap orders in transaction.
   */
  protected swapOrders(transaction: Transaction): LiquidityPoolSwap[] {
    return [];
  }

  /**
   * Check for ZAP orders in transaction.
   */
  protected zapOrders(transaction: Transaction): Promise<LiquidityPoolZap[]> {
    return Promise.resolve([]);
  }

  /**
   * Check for updated liquidity pool states in transaction.
   */
  protected liquidityPoolStates(
    transaction: Transaction
  ): LiquidityPoolState[] {
    // todo: pool datum has fee sharing. DefinitionBuilder will not pick up state if that is provided
    return transaction.outputs
      .map((output: Utxo) => {
        // Check if pool output is valid
        const hasFactoryNft: boolean = output.assetBalances.some(
          (balance: AssetBalance) => {
            return [FACTORY_V1_POLICY_ID, FACTORY_V2_POLICY_ID].includes(
              balance.asset.policyId
            );
          }
        );

        if (!output.datum || !hasFactoryNft) {
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
          const poolNft: Asset | undefined = output.assetBalances.find(
            (balance: AssetBalance) => {
              return [POOL_V1_NFT_POLICY_ID, POOL_V2_NFT_POLICY_ID].includes(
                balance.asset.policyId
              );
            }
          )?.asset;

          if (!poolNft) return undefined;

          const lpToken: Asset = new Asset(
            poolNft.policyId === POOL_V1_NFT_POLICY_ID
              ? LP_TOKEN_V1_POLICY_ID
              : LP_TOKEN_V2_POLICY_ID,
            poolNft.nameHex
          );

          const reserveA: bigint =
            tokenA === 'lovelace'
              ? output.lovelaceBalance - MIN_ADA
              : (output.assetBalances.find(
                  (balance: AssetBalance) =>
                    balance.asset.identifier() === tokenA.identifier()
                )?.quantity ?? 0n);

          const reserveB: bigint =
            tokenB === 'lovelace'
              ? output.lovelaceBalance - MIN_ADA
              : (output.assetBalances.find(
                  (balance: AssetBalance) =>
                    balance.asset.identifier() === tokenB.identifier()
                )?.quantity ?? 0n);

          const possibleOperationStatuses: OperationStatus[] =
            this.spentOperationInputs(transaction);

          return LiquidityPoolState.make(
            Dex.Minswap,
            output.toAddress,
            `${tokenId(tokenA)}.${tokenId(tokenB)}`,
            tokenA,
            tokenB,
            lpToken,
            String(reserveA),
            String(reserveB),
            Number(datumParameters.TotalLpTokens),
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
              minAda: MIN_ADA.toString(),
              batcherFee: BATCHER_FEE.toString(),
              feeNumerator: FEE_NUMERATOR,
              feeDenominator: FEE_DENOMINATOR,
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
    return [];
  }

  /**
   * Check for liquidity pool withdraws in transaction.
   */
  protected withdrawOrders(transaction: Transaction): LiquidityPoolWithdraw[] {
    return [];
  }
}
