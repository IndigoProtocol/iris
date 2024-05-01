import { HybridOperation } from '../types';
import { AmmOperationHandler } from './AmmOperationHandler';
import { OrderBookOperationHandler } from './OrderBookOperationHandler';
import { LiquidityPoolState } from '../db/entities/LiquidityPoolState';
import { LiquidityPoolDeposit } from '../db/entities/LiquidityPoolDeposit';
import { LiquidityPoolWithdraw } from '../db/entities/LiquidityPoolWithdraw';
import { LiquidityPoolZap } from '../db/entities/LiquidityPoolZap';
import { OperationStatus } from '../db/entities/OperationStatus';
import { OrderBookMatch } from '../db/entities/OrderBookMatch';
import { OrderBookOrder } from '../db/entities/OrderBookOrder';
import { LiquidityPoolSwap } from '../db/entities/LiquidityPoolSwap';
import { dbService } from '../indexerServices';
import { EntityManager, IsNull } from 'typeorm';
import { LiquidityPool } from '../db/entities/LiquidityPool';

export class HybridOperationHandler {

    private _ammHandler: AmmOperationHandler;
    private _orderBookHandler: OrderBookOperationHandler;

    constructor() {
        this._ammHandler = new AmmOperationHandler();
        this._orderBookHandler = new OrderBookOperationHandler();
    }

    public async handle(operation: HybridOperation): Promise<any> {
        // Non-relevant AMM operations
        if (
            operation instanceof LiquidityPoolState
            || operation instanceof LiquidityPoolDeposit
            || operation instanceof LiquidityPoolWithdraw
            || operation instanceof LiquidityPoolZap
            || operation instanceof OperationStatus
        ) {
            return this._ammHandler.handle(operation);
        }

        // Non-relevant Order Book operations
        if (operation instanceof OrderBookOrder) {
            return this._orderBookHandler.handle(operation);
        }
        if ('type' in operation && operation.type === 'OrderBookOrderCancellation') {
            return this._orderBookHandler.handle(operation);
        }

        // Handle within
        if (operation instanceof LiquidityPoolSwap) {
            return this.handleSwapOrder(operation);
        }
        if (operation instanceof OrderBookMatch) {
            return this.handleMatch(operation);
        }

        return Promise.resolve();
    }

    private async handleSwapOrder(order: LiquidityPoolSwap): Promise<any> {
        const liquidityPool: LiquidityPool | undefined = await dbService.query((manager: EntityManager) => {
            return manager.findOne(LiquidityPool, {
                where: order.liquidityPoolIdentifier
                    ? [{
                        dex: order.dex,
                        identifier: order.liquidityPoolIdentifier,
                    }]
                    : [{
                        dex: order.dex,
                        tokenA: {
                            id: order.swapInToken ? order.swapInToken.id : IsNull(),
                        },
                        tokenB: {
                            id: order.swapOutToken ? order.swapOutToken.id : IsNull(),
                        },
                    }, {
                        dex: order.dex,
                        tokenA: {
                            id: order.swapOutToken ? order.swapOutToken.id : IsNull(),
                        },
                        tokenB: {
                            id: order.swapInToken ? order.swapInToken.id : IsNull(),
                        },
                    }],
            }) ?? undefined;
        });

        if (liquidityPool) {
            return this._ammHandler.handle(order);
        }

        return this._orderBookHandler.handle(this.swapToOrderBookOrder(order));
    }

    private async handleMatch(match: OrderBookMatch): Promise<any> {
        const existingSwap: LiquidityPoolSwap | undefined = await dbService.query((manager: EntityManager) => {
            return manager.findOne(LiquidityPoolSwap, {
                relations: ['swapInToken', 'swapOutToken'],
                where: [
                    {
                        liquidityPool: {
                            dex: match.dex,
                        },
                    },
                    {
                        txHash: match.consumedTxHash,
                    },
                ]
            }) ?? undefined;
        });

        // Matched with pool order. Convert to order book order
        if (existingSwap) {
            const orderBookOrder: OrderBookOrder = this.swapToOrderBookOrder(existingSwap);

            orderBookOrder.unFilledOfferAmount -= match.matchedAmount;

            return this._orderBookHandler.handle(orderBookOrder).then(() => {
                return dbService.dbSource.transaction((manager: EntityManager) => {
                   return manager.delete(LiquidityPoolSwap, { id: existingSwap.id });
                });
            });
        }

        return this._orderBookHandler.handle(match);
    }

    private swapToOrderBookOrder(order: LiquidityPoolSwap): OrderBookOrder {
        return OrderBookOrder.make(
            order.dex,
            order.swapInToken ?? 'lovelace',
            order.swapOutToken ?? 'lovelace',
            '',
            order.swapInAmount,
            order.swapInAmount,
            order.minReceive ?? 0,
            Number(order.swapInAmount) / Number(order.minReceive),
            0,
            false,
            order.dexFeesPaid,
            order.senderPubKeyHash,
            order.senderStakeKeyHash,
            order.slot,
            order.txHash,
            order.outputIndex,
        );
    }

}