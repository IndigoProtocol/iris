import { BaseJob } from './BaseJob';
import { Brackets, EntityManager } from 'typeorm';
import { dbService } from '../indexerServices';
import { AssetBalance, Utxo } from '../types';
import { LiquidityPoolState } from '../db/entities/LiquidityPoolState';
import { LiquidityPoolSwap } from '../db/entities/LiquidityPoolSwap';
import { lucidUtils, tokenId } from '../utils';
import { logInfo } from '../logger';
import { AddressDetails } from 'lucid-cardano';
import { Asset } from '../db/entities/Asset';

export class UpdateAmountReceived extends BaseJob {

    private readonly _liquidityPoolState: LiquidityPoolState;

    constructor(state: LiquidityPoolState) {
        super();

        this._liquidityPoolState = state;
    }

    /**
     * Update a swap order with amount received.
     * Compare the last state with the new state to get the amount difference for the order.
     */
    public async handle(): Promise<any> {
        if (! this._liquidityPoolState.liquidityPool) return Promise.reject('Liquidity pool not provided');

        logInfo(`[Queue] \t UpdateAmountReceived for state ${this._liquidityPoolState.txHash}`);

        let swapOrders: LiquidityPoolSwap[] | null = await dbService.dbSource.createQueryBuilder(LiquidityPoolSwap, 'orders')
            .leftJoinAndSelect('orders.swapOutToken', 'swapOutToken')
            .where(new Brackets((query) => {
                this._liquidityPoolState.transactionInputs.forEach((input: Utxo, index: number) => {
                    query.orWhere(new Brackets((query1) => {
                        const params: any = {};

                        params[`txHash${index}`] = input.forTxHash;
                        params[`index${index}`] = input.index;

                        query1.where(`orders.txHash = :txHash${index}`, params)
                            .andWhere(`orders.outputIndex = :index${index}`, params);
                    }))
                });
            }))
            .andWhere('orders.liquidityPoolId = :poolId', { poolId: this._liquidityPoolState.liquidityPool.id })
            .orderBy('orders.outputIndex', 'ASC')
            .getMany();

        // Could be a deposit / withdraw
        if (! swapOrders) return Promise.reject('Unable to find linked swap order to update amount received');

        const stakeKeys: string[] = [...new Set(swapOrders.map((order: LiquidityPoolSwap) => order.senderStakeKeyHash))];

        stakeKeys.forEach((stakeKey: string) => {
            return swapOrders
                ?.filter((order: LiquidityPoolSwap) => order.senderStakeKeyHash && order.senderStakeKeyHash === stakeKey)
                .forEach((order: LiquidityPoolSwap, index: number) => {
                    const possibleOutputs: Utxo[] = this._liquidityPoolState.transactionOutputs
                        .filter((utxo: Utxo) => {
                            const addressDetails: AddressDetails = lucidUtils.getAddressDetails(utxo.toAddress);

                            return addressDetails.stakeCredential && addressDetails.stakeCredential.hash === order.senderStakeKeyHash;
                        });

                    if (possibleOutputs.length === 0) return;

                    logInfo(`[Queue] \t\t Updating receive for swap order ${order.txHash}`);

                    const settledUtxo: Utxo | undefined = possibleOutputs[index];

                    if (! settledUtxo) return;

                    const amountToAddress: bigint = ! order.swapOutToken
                        ? settledUtxo.lovelaceBalance - 2_000000n
                        : settledUtxo.assetBalances.find((assetBalance: AssetBalance) => tokenId(assetBalance.asset) === tokenId(order.swapOutToken as Asset))?.quantity ?? 0n;

                    if (amountToAddress === 0n) return undefined;

                    order.actualReceive = Number(amountToAddress);

                    return;
                });
        });

        if (! swapOrders || swapOrders.length === 0) return Promise.resolve();

        return dbService.transaction((manager: EntityManager) => {
            return Promise.any(
                (swapOrders || []).map((order: LiquidityPoolSwap) => {
                    return manager.createQueryBuilder()
                        .update(LiquidityPoolSwap)
                        .set({
                            actualReceive: order.actualReceive,
                        })
                        .where('id = :id', { id: order.id })
                        .execute()
                })
            );
        });
    }

}
