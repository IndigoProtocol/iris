// import { BaseAmmDexAnalyzer } from './BaseAmmDexAnalyzer';
// import {
//     AssetBalance,
//     DatumParameters,
//     DefinitionConstr,
//     DefinitionField,
//     AmmDexOperation,
//     Transaction,
//     Utxo,
// } from '../types';
// import { DefinitionBuilder } from '../DefinitionBuilder';
// import { lucidUtils, toDefinitionDatum, tokenId } from '../utils';
// import { AddressDetails, Data } from 'lucid-cardano';
// import { Dex, SwapOrderType } from '../constants';
// import swapDefinition from './definitions/minswap-v2/swap';
// import zapDefinition from './definitions/minswap-v2/zap';
// import poolDefinition from './definitions/minswap-v2/pool';
// import poolDepositDefinition from './definitions/minswap-v2/pool-deposit';
// import poolWithdrawDefinition from './definitions/minswap-v2/pool-withdraw';
// import { Asset, Token } from '../db/entities/Asset';
// import { LiquidityPoolSwap } from '../db/entities/LiquidityPoolSwap';
// import { LiquidityPoolZap } from '../db/entities/LiquidityPoolZap';
// import { LiquidityPoolState } from '../db/entities/LiquidityPoolState';
// import { LiquidityPoolDeposit } from '../db/entities/LiquidityPoolDeposit';
// import { LiquidityPoolWithdraw } from '../db/entities/LiquidityPoolWithdraw';
// import { OperationStatus } from '../db/entities/OperationStatus';
// import { LiquidityPool } from '../db/entities/LiquidityPool';
//
// /**
//  * Minswap constants.
//  */
// const LP_TOKEN_POLICY_ID: string = 'f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c';
// const VALIDITY_TOKEN: string = 'f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c4d5350';
// const CANCEL_ORDER_DATUM: string = 'd87a80';
// const ORDER_SCRIPT_HASH: string = 'c3e28c36c3447315ba5a56f33da6a6ddc1770a876a8d9f0cb3a97c4c';
//
// export class MinswapV2Analyzer extends BaseAmmDexAnalyzer {
//
//     public startSlot: number = 128247239;
//
//     /**
//      * Analyze transaction for possible DEX operations.
//      */
//     public async analyzeTransaction(transaction: Transaction): Promise<AmmDexOperation[]> {
//         return Promise.all([
//             this.liquidityPoolStates(transaction),
//             this.swapOrders(transaction),
//             // this.zapOrders(transaction),
//             this.depositOrders(transaction),
//             // this.withdrawOrders(transaction),
//             // this.cancelledOperationInputs(transaction, [ORDER_V1_CONTRACT_ADDRESS, ORDER_V2_CONTRACT_ADDRESS, ORDER_V3_CONTRACT_ADDRESS], CANCEL_ORDER_DATUM),
//         ]).then((operations: AmmDexOperation[][]) => operations.flat());
//     }
//
//     /**
//      * Check for swap orders in transaction.
//      */
//     protected async swapOrders(transaction: Transaction): Promise<LiquidityPoolSwap[]> {
//         const promises: Promise<LiquidityPoolSwap | undefined>[] = transaction.outputs.map((output: Utxo) => {
//             return new Promise(async (resolve, reject) => {
//                 if (! output.datum) {
//                     return resolve(undefined);
//                 }
//
//                 const addressDetails: AddressDetails = lucidUtils.getAddressDetails(output.toAddress);
//
//                 if (addressDetails.paymentCredential?.hash !== ORDER_SCRIPT_HASH) {
//                     return resolve(undefined);
//                 }
//
//                 try {
//                     const definitionField: DefinitionField = toDefinitionDatum(
//                         Data.from(output.datum)
//                     );
//                     const builder: DefinitionBuilder = new DefinitionBuilder(swapDefinition);
//                     const datumParameters: DatumParameters = builder.pullParameters(definitionField as DefinitionConstr);
//
//                     const existingPool: LiquidityPool | undefined = await this.liquidityPoolFromIdentifier(
//                         `${datumParameters.LpTokenPolicyId}${datumParameters.LpTokenAssetName}`
//                     );
//
//                     if (! existingPool) return reject(`Unable to find ${Dex.MinswapV2} pool with identifier ${datumParameters.PoolIdentifier}`);
//
//                     return resolve(
//                         LiquidityPoolSwap.make(
//                             Dex.MinswapV2,
//                             existingPool.identifier,
//                             datumParameters.Direction === 1 ? existingPool.tokenA : existingPool.tokenB,
//                             datumParameters.Direction === 1 ? existingPool.tokenB : existingPool.tokenA,
//                             Number(datumParameters.SwapInAmount),
//                             Number(datumParameters.MinReceive),
//                             Number(datumParameters.BatcherFee),
//                             datumParameters.SenderPubKeyHash as string,
//                             (datumParameters.SenderStakingKeyHash ?? '') as string,
//                             transaction.blockSlot,
//                             transaction.hash,
//                             output.index,
//                             output.toAddress,
//                             SwapOrderType.Instant,
//                             transaction,
//                         )
//                     );
//                 } catch (e) {
//                     return resolve(undefined);
//                 }
//             });
//         });
//
//         return Promise.all(promises)
//             .then((swapOrders: (LiquidityPoolSwap | undefined)[]) => {
//                 return swapOrders.filter((operation: LiquidityPoolSwap | undefined) => operation !== undefined) as LiquidityPoolSwap[]
//             });
//     }
//
//     /**
//      * Check for ZAP orders in transaction.
//      */
//     protected zapOrders(transaction: Transaction): Promise<LiquidityPoolZap[]> {
//         const promises: Promise<LiquidityPoolZap | undefined>[] = transaction.outputs.map((output: Utxo) => {
//             return new Promise(async (resolve) => {
//                 if (! [ORDER_V1_CONTRACT_ADDRESS, ORDER_V2_CONTRACT_ADDRESS, ORDER_V3_CONTRACT_ADDRESS].includes(output.toAddress) || ! output.datum) {
//                     return resolve(undefined);
//                 }
//
//                 try {
//                     const definitionField: DefinitionField = toDefinitionDatum(
//                         Data.from(output.datum)
//                     );
//                     const builder: DefinitionBuilder = new DefinitionBuilder(zapDefinition);
//                     const datumParameters: DatumParameters = builder.pullParameters(definitionField as DefinitionConstr);
//
//                     const swapInToken: Token = output.assetBalances.length > 0
//                         ? output.assetBalances[0].asset
//                         : 'lovelace';
//                     const forToken: Token = datumParameters.TokenPolicyId === ''
//                         ? 'lovelace'
//                         : new Asset(datumParameters.TokenPolicyId as string, datumParameters.TokenAssetName as string);
//
//                     return resolve(
//                         LiquidityPoolZap.make(
//                             Dex.Minswap,
//                             undefined,
//                             swapInToken,
//                             forToken,
//                             Number(swapInToken === 'lovelace'
//                                 ? (output.lovelaceBalance
//                                     - BigInt(datumParameters.BatcherFee as number)
//                                     - BigInt(datumParameters.DepositFee as number))
//                                 : output.assetBalances[0].quantity),
//                             Number(datumParameters.MinReceive),
//                             Number(datumParameters.BatcherFee),
//                             datumParameters.ReceiverPubKeyHash as string,
//                             (datumParameters.ReceiverStakingKeyHash ?? '') as string,
//                             transaction.blockSlot,
//                             transaction.hash,
//                             output.index,
//                             transaction,
//                         )
//                     );
//                 } catch (e) {
//                     return resolve(undefined);
//                 }
//             });
//         });
//
//         return Promise.all(promises)
//             .then((zapOrders: (LiquidityPoolZap | undefined)[]) => {
//                 return zapOrders.filter((operation: LiquidityPoolZap | undefined) => operation !== undefined) as LiquidityPoolZap[]
//             });
//     }
//
//     /**
//      * Check for updated liquidity pool states in transaction.
//      */
//     protected liquidityPoolStates(transaction: Transaction): LiquidityPoolState[] {
//         return transaction.outputs.map((output: Utxo) => {
//             // Check if pool output is valid
//             const hasFactoryNft: boolean = output.assetBalances.some((balance: AssetBalance) => {
//                 return balance.asset.identifier() === VALIDITY_TOKEN;
//             });
//             if (! output.datum || ! hasFactoryNft) {
//                 return undefined;
//             }
//
//             try {
//                 const definitionField: DefinitionField = toDefinitionDatum(
//                     Data.from(output.datum)
//                 );
//                 const builder: DefinitionBuilder = new DefinitionBuilder(poolDefinition);
//                 const datumParameters: DatumParameters = builder.pullParameters(definitionField as DefinitionConstr);
//
//                 const tokenA: Token = datumParameters.PoolAssetAPolicyId === ''
//                     ? 'lovelace'
//                     : new Asset(datumParameters.PoolAssetAPolicyId as string, datumParameters.PoolAssetAAssetName as string);
//                 const tokenB: Token = datumParameters.PoolAssetBPolicyId === ''
//                     ? 'lovelace'
//                     : new Asset(datumParameters.PoolAssetBPolicyId as string, datumParameters.PoolAssetBAssetName as string);
//                 const lpToken: Asset | undefined = output.assetBalances.find((balance: AssetBalance) => {
//                     return balance.asset.policyId === LP_TOKEN_POLICY_ID;
//                 })?.asset;
//
//                 if (! lpToken) return undefined;
//
//                 const reserveA: bigint = tokenA === 'lovelace'
//                     ? output.lovelaceBalance
//                     : output.assetBalances.find((balance: AssetBalance) =>  balance.asset.identifier() === tokenA.identifier())?.quantity ?? 0n;
//
//                 const reserveB: bigint = tokenB === 'lovelace'
//                     ? output.lovelaceBalance
//                     : output.assetBalances.find((balance: AssetBalance) =>  balance.asset.identifier() === tokenB.identifier())?.quantity ?? 0n;
//
//                 const possibleOperationStatuses: OperationStatus[] = this.spentOperationInputs(transaction);
//
//                 return LiquidityPoolState.make(
//                     Dex.MinswapV2,
//                     output.toAddress,
//                     lpToken.identifier(),
//                     tokenA,
//                     tokenB,
//                     lpToken,
//                     Number(reserveA),
//                     Number(reserveB),
//                     Number(datumParameters.TotalLpTokens),
//                     Number(datumParameters.BaseFee) / 100,
//                     transaction.blockSlot,
//                     transaction.hash,
//                     possibleOperationStatuses,
//                     transaction.inputs,
//                     transaction.outputs.filter((sibling: Utxo) => sibling.index !== output.index),
//                 );
//             } catch (e) {
//                 return undefined;
//             }
//         }).flat().filter((operation: LiquidityPoolState | undefined) => operation !== undefined) as (LiquidityPoolState)[];
//     }
//
//     /**
//      * Check for liquidity pool deposits in transaction.
//      */
//     protected async depositOrders(transaction: Transaction): Promise<LiquidityPoolDeposit[]> {
//         const promises: Promise<LiquidityPoolDeposit | undefined>[] = transaction.outputs.map((output: Utxo) => {
//             return new Promise(async (resolve, reject) => {
//                 if (! output.datum) {
//                     return resolve(undefined);
//                 }
//
//                 const addressDetails: AddressDetails = lucidUtils.getAddressDetails(output.toAddress);
//
//                 if (addressDetails.paymentCredential?.hash !== ORDER_SCRIPT_HASH) {
//                     return resolve(undefined);
//                 }
//
//                 try {
//                     const definitionField: DefinitionField = toDefinitionDatum(
//                         Data.from(output.datum)
//                     );
//                     const builder: DefinitionBuilder = new DefinitionBuilder(poolDepositDefinition);
//                     const datumParameters: DatumParameters = builder.pullParameters(definitionField as DefinitionConstr);
//
//                     const existingPool: LiquidityPool | undefined = await this.liquidityPoolFromIdentifier(
//                         `${datumParameters.LpTokenPolicyId}${datumParameters.LpTokenAssetName}`
//                     );
//
//                     if (! existingPool) return reject(`Unable to find ${Dex.MinswapV2} pool`);
//
//                     return LiquidityPoolDeposit.make(
//                         Dex.MinswapV2,
//                         existingPool.identifier,
//                         existingPool.tokenA,
//                         existingPool.tokenB,
//                         Number(datumParameters.DepositA),
//                         Number(datumParameters.DepositB),
//                         Number(datumParameters.MinReceive),
//                         Number(datumParameters.BatcherFee),
//                         datumParameters.SenderPubKeyHash as string,
//                         (datumParameters.SenderStakingKeyHash ?? '') as string,
//                         transaction.blockSlot,
//                         transaction.hash,
//                         output.index,
//                         transaction,
//                     );
//                 } catch (e) {
//                     return resolve(undefined);
//                 }
//             });
//         });
//
//         return Promise.all(promises)
//             .then((orders: (LiquidityPoolDeposit | undefined)[]) => {
//                 return orders.filter((operation: LiquidityPoolDeposit | undefined) => operation !== undefined) as LiquidityPoolDeposit[]
//             });
//     }
//
//     /**
//      * Check for liquidity pool withdraws in transaction.
//      */
//     protected withdrawOrders(transaction: Transaction): LiquidityPoolWithdraw[] {
//         return transaction.outputs.map((output: Utxo) => {
//             if (! [ORDER_V1_CONTRACT_ADDRESS, ORDER_V2_CONTRACT_ADDRESS, ORDER_V3_CONTRACT_ADDRESS].includes(output.toAddress) || ! output.datum) {
//                 return undefined;
//             }
//
//             try {
//                 const definitionField: DefinitionField = toDefinitionDatum(
//                     Data.from(output.datum)
//                 );
//                 const builder: DefinitionBuilder = new DefinitionBuilder(poolWithdrawDefinition);
//                 const datumParameters: DatumParameters = builder.pullParameters(definitionField as DefinitionConstr);
//
//                 const lpToken: Asset | undefined = output.assetBalances.find((assetBalance: AssetBalance) => {
//                     return assetBalance.asset.policyId === LP_TOKEN_V1_POLICY_ID || assetBalance.asset.policyId === LP_TOKEN_V2_POLICY_ID;
//                 })?.asset;
//
//                 if (! lpToken) {
//                     return undefined;
//                 }
//
//                 return LiquidityPoolWithdraw.make(
//                     Dex.Minswap,
//                     undefined,
//                     lpToken,
//                     Number(output.assetBalances[0].quantity),
//                     Number(datumParameters.MinReceiveA),
//                     Number(datumParameters.MinReceiveB),
//                     Number(datumParameters.BatcherFee),
//                     datumParameters.ReceiverPubKeyHash as string,
//                     (datumParameters.ReceiverStakingKeyHash ?? '') as string,
//                     transaction.blockSlot,
//                     transaction.hash,
//                     output.index,
//                     transaction,
//                 );
//             } catch (e) {
//                 return undefined;
//             }
//         }).filter((operation: LiquidityPoolWithdraw | undefined) => operation !== undefined) as LiquidityPoolWithdraw[];
//     }
//
// }
