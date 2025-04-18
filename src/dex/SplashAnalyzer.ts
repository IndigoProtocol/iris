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
import poolDefinition from './definitions/splash/pool';
import poolDepositDefinition from './definitions/splash/pool-deposit';
import poolWithdrawDefinition from './definitions/splash/pool-withdraw';
import swapDefinition from './definitions/splash/swap';

/**
 * Splash constants.
 */
const SPECTRUM_POOL_V1_CONTRACT_ADDRESS: string =
  'addr1x8nz307k3sr60gu0e47cmajssy4fmld7u493a4xztjrll0aj764lvrxdayh2ux30fl0ktuh27csgmpevdu89jlxppvrswgxsta';
const SPECTRUM_POOL_V2_CONTRACT_ADDRESS: string =
  'addr1x94ec3t25egvhqy2n265xfhq882jxhkknurfe9ny4rl9k6dj764lvrxdayh2ux30fl0ktuh27csgmpevdu89jlxppvrst84slu';
const DEPOSIT_CONTRACT_ADDRESS: string =
  'addr1wyr4uz0tp75fu8wrg6gm83t20aphuc9vt6n8kvu09ctkugqpsrmeh';
const WITHDRAW_CONTRACT_ADDRESS: string =
  'addr1wxpa5704x8qel88ympf4natfdzn59nc9esj7609y3sczmmsasees8';
const CANCEL_ORDER_DATUM: string = 'd87980';
const ORDER_SCRIPT_HASHES: string[] = [
  '2025463437ee5d64e89814a66ce7f98cb184a66ae85a2fbbfd750106',
  '464eeee89f05aff787d40045af2a40a83fd96c513197d32fbc54ff02',
];
const CANCEL_REFERENCE_TX_HASHES: string[] = [
  'b91eda29d145ab6c0bc0d6b7093cb24b131440b7b015033205476f39c690a51f',
];
const POOL_CONTRACT_STAKE_KEY: string =
  'b2f6abf60ccde92eae1a2f4fdf65f2eaf6208d872c6f0e597cc10b07';
const ACTION_SWAP: string = '00';
const MAX_INT: bigint = 9_223_372_036_854_775_807n;
const BATCHER_FEE = 2_000_000n;
const FEE_DENOMINATOR = 100_000;

export class SplashAnalyzer extends BaseAmmDexAnalyzer {
  public startSlot: number = 116958314;

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
        CANCEL_ORDER_DATUM,
        CANCEL_REFERENCE_TX_HASHES
      ),
    ]).then((operations: AmmDexOperation[][]) => operations.flat());
  }

  /**
   * Check for swap orders in transaction.
   */
  protected async swapOrders(
    transaction: Transaction
  ): Promise<LiquidityPoolSwap[]> {
    return transaction.outputs
      .map((output: Utxo) => {
        if (!output.datum) {
          return undefined;
        }

        const addressDetails: AddressDetails = getAddressDetails(
          output.toAddress
        );

        if (
          !addressDetails.paymentCredential ||
          !ORDER_SCRIPT_HASHES.includes(addressDetails.paymentCredential?.hash)
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

          if (datumParameters.Action !== ACTION_SWAP) return undefined;

          const swapInToken: Token =
            datumParameters.SwapInTokenPolicyId === ''
              ? 'lovelace'
              : new Asset(
                  datumParameters.SwapInTokenPolicyId as string,
                  datumParameters.SwapInTokenAssetName as string
                );
          const swapOutToken: Token =
            datumParameters.SwapOutTokenPolicyId === ''
              ? 'lovelace'
              : new Asset(
                  datumParameters.SwapOutTokenPolicyId as string,
                  datumParameters.SwapOutTokenAssetName as string
                );

          return LiquidityPoolSwap.make(
            Dex.Splash,
            undefined,
            swapInToken,
            swapOutToken,
            Number(datumParameters.SwapInAmount),
            Number(datumParameters.MinReceive),
            Number(datumParameters.ExecutionFee),
            datumParameters.SenderPubKeyHash as string,
            (datumParameters.SenderStakingKeyHash ?? '') as string,
            transaction.blockSlot,
            transaction.hash,
            output.index,
            output.toAddress,
            SwapOrderType.Instant,
            transaction,
            Dex.Spectrum
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
        if (!output.datum) {
          return undefined;
        }

        if (
          [
            SPECTRUM_POOL_V1_CONTRACT_ADDRESS,
            SPECTRUM_POOL_V2_CONTRACT_ADDRESS,
          ].includes(output.toAddress)
        ) {
          return undefined;
        }

        const addressDetails: AddressDetails = getAddressDetails(
          output.toAddress
        );

        if (addressDetails.stakeCredential?.hash !== POOL_CONTRACT_STAKE_KEY) {
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

          const nft: Asset | undefined = output.assetBalances.find(
            (balance: AssetBalance) => {
              return (
                balance.asset.identifier() ===
                `${datumParameters.TokenPolicyId}${datumParameters.TokenAssetName}`
              );
            }
          )?.asset;
          const lpTokenBalance: AssetBalance | undefined =
            output.assetBalances.find((balance: AssetBalance) => {
              return (
                balance.asset.identifier() ===
                `${datumParameters.LpTokenPolicyId}${datumParameters.LpTokenAssetName}`
              );
            });

          if (!nft || !lpTokenBalance) return undefined;

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

          const possibleOperationStatuses: OperationStatus[] =
            this.spentOperationInputs(transaction);

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

          if (reserveA === 0n || reserveB === 0n) return undefined;

          return LiquidityPoolState.make(
            Dex.Splash,
            output.toAddress,
            nft.identifier(),
            tokenA,
            tokenB,
            lpTokenBalance.asset,
            String(reserveA - BigInt(datumParameters.PoolAssetATreasury ?? 0)),
            String(reserveB - BigInt(datumParameters.PoolAssetBTreasury ?? 0)),
            Number(MAX_INT - lpTokenBalance.quantity),
            (1 - Number(datumParameters.LpFee) / FEE_DENOMINATOR) * 100,
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
              // swapFee = lpFee + treasuryFee
              // The lpFee is reversed, so we need to subtract it
              feeNumerator:
                Number(datumParameters.LpFee ?? 0) -
                Number(datumParameters.TreasuryFee ?? 0),
              feeDenominator: FEE_DENOMINATOR,
              minAda: 0n.toString(),
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
            Dex.Splash,
            `${datumParameters.TokenPolicyId}${datumParameters.TokenAssetName}`,
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
            transaction,
            Dex.Spectrum
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
            Dex.Splash,
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
            transaction,
            Dex.Spectrum
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
