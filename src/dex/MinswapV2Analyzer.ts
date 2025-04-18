import {
  AddressDetails,
  Data,
  getAddressDetails,
} from '@lucid-evolution/lucid';
import { Dex, SwapOrderType } from '../constants';
import { Asset, Token } from '../db/entities/Asset';
import { LiquidityPool } from '../db/entities/LiquidityPool';
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
import { toDefinitionDatum } from '../utils';
import { BaseAmmDexAnalyzer } from './BaseAmmDexAnalyzer';
import poolDefinition from './definitions/minswap-v2/pool';
import poolDepositDefinition from './definitions/minswap-v2/pool-deposit';
import poolWithdrawDefinition from './definitions/minswap-v2/pool-withdraw';
import swapDefinition from './definitions/minswap-v2/swap';
import zapDefinition from './definitions/minswap-v2/zap';

/**
 * MinswapV2 constants.
 */
const LP_TOKEN_POLICY_ID: string =
  'f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c';
const MSP: string =
  'f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c4d5350';
const CANCEL_ORDER_DATUM: string = 'd87a80';
const ORDER_SCRIPT_HASH: string =
  'c3e28c36c3447315ba5a56f33da6a6ddc1770a876a8d9f0cb3a97c4c';
const CANCEL_REFERENCE_TX_HASHES: string[] = [
  'cf4ecddde0d81f9ce8fcc881a85eb1f8ccdaf6807f03fea4cd02da896a621776',
];
const BATCHER_FEE = 2_000_000n;
const MIN_ADA = 0n;
const FEE_DENOMINATOR = 10_000;

export class MinswapV2Analyzer extends BaseAmmDexAnalyzer {
  public startSlot: number = 128247239;

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
  protected async swapOrders(
    transaction: Transaction
  ): Promise<LiquidityPoolSwap[]> {
    const promises: Promise<LiquidityPoolSwap | undefined>[] =
      transaction.outputs.map((output: Utxo) => {
        return new Promise(async (resolve, reject) => {
          if (!output.datum) {
            return resolve(undefined);
          }

          const addressDetails: AddressDetails = getAddressDetails(
            output.toAddress
          );

          if (addressDetails.paymentCredential?.hash !== ORDER_SCRIPT_HASH) {
            return resolve(undefined);
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

            if (![0, 1].includes(datumParameters.Direction as number)) {
              return resolve(undefined);
            }

            const lpToken: Asset = new Asset(
              datumParameters.LpTokenPolicyId as string,
              datumParameters.LpTokenAssetName as string
            );

            const existingPool: LiquidityPool | undefined =
              await this.liquidityPoolFromIdentifier(lpToken.identifier());

            if (!existingPool)
              return reject(
                `Unable to find ${
                  Dex.MinswapV2
                } pool with identifier ${lpToken.identifier()}`
              );

            return resolve(
              LiquidityPoolSwap.make(
                Dex.MinswapV2,
                existingPool.identifier,
                datumParameters.Direction === 1
                  ? existingPool.tokenA
                  : existingPool.tokenB,
                datumParameters.Direction === 1
                  ? existingPool.tokenB
                  : existingPool.tokenA,
                Number(datumParameters.SwapInAmount),
                Number(datumParameters.MinReceive),
                Number(datumParameters.BatcherFee),
                datumParameters.SenderPubKeyHash as string,
                (datumParameters.SenderStakingKeyHash ?? '') as string,
                transaction.blockSlot,
                transaction.hash,
                output.index,
                output.toAddress,
                SwapOrderType.Instant,
                transaction
              )
            );
          } catch (e) {
            return resolve(undefined);
          }
        });
      });

    return Promise.all(promises)
      .then((swapOrders: (LiquidityPoolSwap | undefined)[]) => {
        return swapOrders.filter(
          (operation: LiquidityPoolSwap | undefined) => operation !== undefined
        ) as LiquidityPoolSwap[];
      })
      .catch(() => Promise.resolve([]));
  }

  /**
   * Check for ZAP orders in transaction.
   */
  protected zapOrders(transaction: Transaction): Promise<LiquidityPoolZap[]> {
    const promises: Promise<LiquidityPoolZap | undefined>[] =
      transaction.outputs.map((output: Utxo) => {
        return new Promise(async (resolve, reject) => {
          if (!output.datum) {
            return resolve(undefined);
          }

          const addressDetails: AddressDetails = getAddressDetails(
            output.toAddress
          );

          if (addressDetails.paymentCredential?.hash !== ORDER_SCRIPT_HASH) {
            return resolve(undefined);
          }

          try {
            const definitionField: DefinitionField = toDefinitionDatum(
              Data.from(output.datum)
            );
            const builder: DefinitionBuilder = new DefinitionBuilder(
              zapDefinition
            );
            const datumParameters: DatumParameters = builder.pullParameters(
              definitionField as DefinitionConstr
            );

            const lpToken: Asset = new Asset(
              datumParameters.LpTokenPolicyId as string,
              datumParameters.LpTokenAssetName as string
            );

            const existingPool: LiquidityPool | undefined =
              await this.liquidityPoolFromIdentifier(lpToken.identifier());

            if (!existingPool)
              return reject(
                `Unable to find ${
                  Dex.MinswapV2
                } pool with identifier ${lpToken.identifier()}`
              );

            let swapInToken: Token;
            let forToken: Token;
            let swapInAmount: number;

            if (Number(datumParameters.SwapInA as number) > 0) {
              swapInToken = existingPool.tokenA ?? 'lovelace';
              forToken = existingPool.tokenB;
              swapInAmount = Number(datumParameters.SwapInA as number);
            } else {
              swapInToken = existingPool.tokenB;
              forToken = existingPool.tokenA ?? 'lovelace';
              swapInAmount = Number(datumParameters.SwapInB as number);
            }

            return resolve(
              LiquidityPoolZap.make(
                Dex.MinswapV2,
                undefined,
                swapInToken,
                forToken,
                swapInAmount,
                Number(datumParameters.MinReceive),
                Number(datumParameters.BatcherFee),
                datumParameters.SenderPubKeyHash as string,
                (datumParameters.SenderStakingKeyHash ?? '') as string,
                transaction.blockSlot,
                transaction.hash,
                output.index,
                transaction
              )
            );
          } catch (e) {
            return resolve(undefined);
          }
        });
      });

    return Promise.all(promises)
      .then((zapOrders: (LiquidityPoolZap | undefined)[]) => {
        return zapOrders.filter(
          (operation: LiquidityPoolZap | undefined) => operation !== undefined
        ) as LiquidityPoolZap[];
      })
      .catch(() => Promise.resolve([]));
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
        const hasFactoryNft: boolean = output.assetBalances.some(
          (balance: AssetBalance) => {
            return balance.asset.policyId === LP_TOKEN_POLICY_ID;
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
          const lpToken: Asset | undefined = output.assetBalances.find(
            (balance: AssetBalance) => {
              return (
                balance.asset.policyId === LP_TOKEN_POLICY_ID &&
                balance.asset.identifier() !== MSP
              );
            }
          )?.asset;

          if (!lpToken) return undefined;

          const possibleOperationStatuses: OperationStatus[] =
            this.spentOperationInputs(transaction);

          return LiquidityPoolState.make(
            Dex.MinswapV2,
            output.toAddress,
            lpToken.identifier(),
            tokenA,
            tokenB,
            lpToken,
            String(datumParameters.ReserveA),
            String(datumParameters.ReserveB),
            Number(datumParameters.TotalLpTokens),
            Number(datumParameters.FeeANumerator) / 100,
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
              feeDenominator: FEE_DENOMINATOR,
              feeNumerator: Number(datumParameters.FeeANumerator ?? 0),
              minAda: MIN_ADA.toString(),
              FeeANumerator: Number(datumParameters.FeeANumerator ?? 0),
              FeeBNumerator: Number(datumParameters.FeeBNumerator ?? 0),
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
  protected async depositOrders(
    transaction: Transaction
  ): Promise<LiquidityPoolDeposit[]> {
    const promises: Promise<LiquidityPoolDeposit | undefined>[] =
      transaction.outputs.map((output: Utxo) => {
        return new Promise(async (resolve, reject) => {
          if (!output.datum) {
            return resolve(undefined);
          }

          const addressDetails: AddressDetails = getAddressDetails(
            output.toAddress
          );

          if (addressDetails.paymentCredential?.hash !== ORDER_SCRIPT_HASH) {
            return resolve(undefined);
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

            const existingPool: LiquidityPool | undefined =
              await this.liquidityPoolFromIdentifier(
                `${datumParameters.LpTokenPolicyId}${datumParameters.LpTokenAssetName}`
              );

            if (!existingPool)
              return reject(`Unable to find ${Dex.MinswapV2} pool`);

            // Zap order
            if (Number(datumParameters.DepositB) === 0)
              return resolve(undefined);

            return resolve(
              LiquidityPoolDeposit.make(
                Dex.MinswapV2,
                existingPool.identifier,
                existingPool.tokenA,
                existingPool.tokenB,
                Number(datumParameters.DepositA),
                Number(datumParameters.DepositB),
                Number(datumParameters.MinReceive),
                Number(datumParameters.BatcherFee),
                datumParameters.SenderPubKeyHash as string,
                (datumParameters.SenderStakingKeyHash ?? '') as string,
                transaction.blockSlot,
                transaction.hash,
                output.index,
                transaction
              )
            );
          } catch (e) {
            return resolve(undefined);
          }
        });
      });

    return Promise.all(promises)
      .then((orders: (LiquidityPoolDeposit | undefined)[]) => {
        return orders.filter(
          (operation: LiquidityPoolDeposit | undefined) =>
            operation !== undefined
        ) as LiquidityPoolDeposit[];
      })
      .catch(() => Promise.resolve([]));
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

        if (addressDetails.paymentCredential?.hash !== ORDER_SCRIPT_HASH) {
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

          const lpToken: Asset | undefined = output.assetBalances.find(
            (assetBalance: AssetBalance) => {
              return (
                assetBalance.asset.policyId ===
                  datumParameters.LpTokenPolicyId ||
                assetBalance.asset.policyId === datumParameters.LpTokenAssetName
              );
            }
          )?.asset;

          if (!lpToken) {
            return undefined;
          }

          return LiquidityPoolWithdraw.make(
            Dex.MinswapV2,
            undefined,
            lpToken,
            Number(output.assetBalances[0].quantity),
            Number(datumParameters.MinReceiveA),
            Number(datumParameters.MinReceiveB),
            Number(datumParameters.BatcherFee),
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
