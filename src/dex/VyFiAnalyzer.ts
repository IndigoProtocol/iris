import { Data } from '@lucid-evolution/lucid';
import axios from 'axios';
import { Dex, SwapOrderType } from '../constants';
import { Asset, Token } from '../db/entities/Asset';
import { LiquidityPoolDeposit } from '../db/entities/LiquidityPoolDeposit';
import { LiquidityPoolState } from '../db/entities/LiquidityPoolState';
import { LiquidityPoolSwap } from '../db/entities/LiquidityPoolSwap';
import { LiquidityPoolWithdraw } from '../db/entities/LiquidityPoolWithdraw';
import { OperationStatus } from '../db/entities/OperationStatus';
import { DefinitionBuilder } from '../DefinitionBuilder';
import {
  AddressMapping,
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
import poolDefinition from './definitions/vyfinance/pool';
import poolDepositDefinition from './definitions/vyfinance/pool-deposit';
import poolWithdrawDefinition from './definitions/vyfinance/pool-withdraw';
import swapDefinition from './definitions/vyfinance/swap';

/**
 * VyFi constants.
 */
const DEPOSIT_FEE: bigint = 2_000000n;
const PROCESS_FEE: bigint = 1_900000n;
const ORDER_ACTION_EXPECT_ASSET: number = 3;
const ORDER_ACTION_EXPECT_ADA: number = 4;
const CANCEL_DATUM: string = 'd87a80';

export class VyFiAnalyzer extends BaseAmmDexAnalyzer {
  public startSlot: number = 92003644;

  private addressMappings: AddressMapping[] = [];
  private orderAddresses: string[] = [];

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
        const poolMapping: AddressMapping | undefined =
          this.addressMappings.find(
            (mapping: AddressMapping) =>
              output.toAddress === mapping.orderAddress
          );

        if (!poolMapping || !output.datum) {
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

          if (
            ![ORDER_ACTION_EXPECT_ADA, ORDER_ACTION_EXPECT_ASSET].includes(
              datumParameters.Action as number
            )
          ) {
            return undefined;
          }

          let swapInToken: Token | undefined;
          let swapOutToken: Token | undefined;
          let swapInAmount: bigint;

          if (output.assetBalances.length > 0) {
            swapInToken = output.assetBalances[0].asset;
            swapInAmount = output.assetBalances[0].quantity;
          } else {
            swapInToken = 'lovelace';
            swapInAmount = output.lovelaceBalance - DEPOSIT_FEE - PROCESS_FEE;
          }

          swapOutToken = tokensMatch(swapInToken, poolMapping.tokenA)
            ? poolMapping.tokenB
            : poolMapping.tokenA;

          return LiquidityPoolSwap.make(
            Dex.VyFinance,
            poolMapping.nftPolicyId,
            swapInToken,
            swapOutToken,
            Number(swapInAmount),
            Number(datumParameters.MinReceive),
            Number(PROCESS_FEE),
            (datumParameters.SenderKeyHashes as string).slice(0, 56),
            (datumParameters.SenderKeyHashes as string).slice(56),
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
        if (!output.datum) {
          return undefined;
        }

        const poolMapping: AddressMapping | undefined =
          this.addressMappings.find(
            (mapping: AddressMapping) =>
              output.toAddress === mapping.poolAddress
          );

        if (!poolMapping) {
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

          const reserveA: bigint =
            poolMapping.tokenA === 'lovelace'
              ? output.lovelaceBalance
              : (output.assetBalances.find(
                  (balance: AssetBalance) =>
                    balance.asset.identifier() ===
                    (poolMapping.tokenA as Asset).identifier()
                )?.quantity ?? 0n);
          const reserveB: bigint =
            output.assetBalances.find(
              (balance: AssetBalance) =>
                balance.asset.identifier() === poolMapping.tokenB.identifier()
            )?.quantity ?? 0n;

          const possibleOperationStatuses: OperationStatus[] =
            this.spentOperationInputs(transaction);

          return LiquidityPoolState.make(
            Dex.VyFinance,
            output.toAddress,
            poolMapping.nftPolicyId,
            poolMapping.tokenA,
            poolMapping.tokenB,
            poolMapping.lpToken,
            String(reserveA),
            String(reserveB),
            Number(datumParameters.TotalLpTokens),
            poolMapping.feePercent / 100,
            transaction.blockSlot,
            transaction.hash,
            possibleOperationStatuses,
            transaction.inputs,
            transaction.outputs.filter(
              (sibling: Utxo) => sibling.index !== output.index
            ),
            {
              txHash: transaction.hash,
              batcherFee: PROCESS_FEE.toString(),
              feeDenominator: 10_000,
              feeNumerator: poolMapping.feePercent,
              minAda: 2_000_000n.toString(),
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
        const poolMapping: AddressMapping | undefined =
          this.addressMappings.find(
            (mapping: AddressMapping) =>
              output.toAddress === mapping.orderAddress
          );

        if (!poolMapping || !output.datum) {
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
            Dex.VyFinance,
            poolMapping.nftPolicyId,
            depositAToken,
            depositBToken,
            Number(
              depositAToken === 'lovelace'
                ? output.lovelaceBalance - DEPOSIT_FEE - PROCESS_FEE
                : output.assetBalances[0].quantity
            ),
            Number(
              depositAToken === 'lovelace'
                ? output.assetBalances[0].quantity
                : output.assetBalances[1].quantity
            ),
            Number(datumParameters.MinReceive),
            Number(PROCESS_FEE),
            (datumParameters.SenderKeyHashes as string).slice(0, 56),
            (datumParameters.SenderKeyHashes as string).slice(56),
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
        const poolMapping: AddressMapping | undefined =
          this.addressMappings.find(
            (mapping: AddressMapping) =>
              output.toAddress === mapping.orderAddress
          );

        if (!poolMapping || !output.datum) {
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
            Dex.VyFinance,
            poolMapping.nftPolicyId,
            poolMapping.lpToken,
            Number(output.assetBalances[0].quantity),
            Number(datumParameters.MinReceiveA),
            Number(datumParameters.MinReceiveB),
            Number(PROCESS_FEE),
            (datumParameters.SenderKeyHashes as string).slice(0, 56),
            (datumParameters.SenderKeyHashes as string).slice(56),
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

  private async loadMappings(): Promise<any> {
    return axios
      .get('https://api.vyfi.io/lp?networkId=1&v2=true')
      .then((response: any) => {
        this.addressMappings = response.data.reduce(
          (mappings: AddressMapping[], poolResponse: any) => {
            const tokens: string[] = poolResponse['unitsPair'].split('/');
            const poolDetails: any = JSON.parse(poolResponse.json);

            mappings.push({
              tokenA:
                tokens[0] === 'lovelace' ? 'lovelace' : Asset.fromId(tokens[0]),
              tokenB: Asset.fromId(tokens[1]),
              lpToken: Asset.fromId(
                poolResponse['lpPolicyId-assetId'].replace('-', '')
              ),
              poolAddress: poolResponse['poolValidatorUtxoAddress'],
              orderAddress: poolResponse['orderValidatorUtxoAddress'],
              nftPolicyId: poolDetails['mainNFT']['currencySymbol'],
              feePercent:
                poolDetails['feesSettings']['barFee'] +
                poolDetails['feesSettings']['liqFee'],
            });

            return mappings;
          },
          []
        );

        this.orderAddresses = this.addressMappings.map(
          (mapping: AddressMapping) => mapping.orderAddress
        );
      })
      .catch(() => Promise.resolve());
  }
}
