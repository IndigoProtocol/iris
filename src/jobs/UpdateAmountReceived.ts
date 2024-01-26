import { BaseJob } from './BaseJob';
import { EntityManager } from 'typeorm';
import { dbService } from '../indexerServices';
import { AssetBalance, Utxo } from '../types';
import { LiquidityPoolState } from '../db/entities/LiquidityPoolState';
import { dbSource } from '../db/data-source';
import { LiquidityPoolSwap } from '../db/entities/LiquidityPoolSwap';
import { lucidUtils, tokenId } from '../utils';
import { logInfo } from '../logger';
import { AddressDetails } from 'lucid-cardano';
import { Asset } from '../db/entities/Asset';
import { dbApiService } from '../apiServices';

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

        logInfo(`[Queue] UpdateAmountReceived for state ${this._liquidityPoolState.txHash}`);

        let swapOrders: LiquidityPoolSwap[] | null = await dbService.dbSource.createQueryBuilder(LiquidityPoolSwap, 'orders')
            .leftJoinAndSelect('orders.swapOutToken', 'swapOutToken')
            .where('orders.txHash IN(:...txHashes)', {
                txHashes: this._liquidityPoolState.transactionInputs.map((input: Utxo) => input.forTxHash)
            })
            .andWhere('orders.liquidityPoolId = :poolId', { poolId: this._liquidityPoolState.liquidityPool.id })
            .getMany();

        // Could be a deposit / withdraw
        if (! swapOrders) return Promise.reject('Unable to find linked swap order to update amount received');

        swapOrders = swapOrders.map((swapOrder: LiquidityPoolSwap) => {
            const settledUtxo: Utxo | undefined = this._liquidityPoolState.transactionOutputs.find((utxo: Utxo) => {
                const addressDetails: AddressDetails = lucidUtils.getAddressDetails(utxo.toAddress);

                return (addressDetails.paymentCredential && addressDetails.paymentCredential.hash === swapOrder.senderPubKeyHash)
                    && (! swapOrder.senderStakeKeyHash || (addressDetails.stakeCredential && addressDetails.stakeCredential.hash === swapOrder.senderStakeKeyHash));
            });

            if (! settledUtxo) return undefined;

            // 2 ADA as estimation for deposit returned
            const amountToAddress: bigint = ! swapOrder.swapOutToken
                ? settledUtxo.lovelaceBalance - 2_000000n
                : settledUtxo.assetBalances.find((assetBalance: AssetBalance) => tokenId(assetBalance.asset) === tokenId(swapOrder.swapOutToken as Asset))?.quantity ?? 0n;

            if (amountToAddress === 0n) return undefined;

            swapOrder.actualReceive = Number(amountToAddress);

            logInfo(`[Queue]\t Updating receive for swap order ${swapOrder.txHash}`);

            return swapOrder;
        }).filter((order: LiquidityPoolSwap | undefined) => order !== undefined) as LiquidityPoolSwap[];

        return dbService.transaction((manager: EntityManager) => {
            return manager.save(swapOrders);
        });
    }

}
