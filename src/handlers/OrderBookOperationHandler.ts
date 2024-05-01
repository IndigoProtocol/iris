import { Dex } from '../constants';
import { OrderBookDexOperation, OrderBookOrderCancellation, TokenMetadata, Utxo } from '../types';
import { logInfo } from '../logger';
import { dbService, eventService, metadataService, operationWs, queue } from '../indexerServices';
import { Asset, Token } from '../db/entities/Asset';
import { BaseEntity, EntityManager, In, IsNull, Not } from 'typeorm';
import CONFIG from '../config';
import { OrderBookOrder } from '../db/entities/OrderBookOrder';
import { OrderBook } from '../db/entities/OrderBook';
import { tokensMatch } from '../utils';
import { OrderBookMatch } from '../db/entities/OrderBookMatch';
import { UpdateOrderBookTicks } from '../jobs/UpdateOrderBookTicks';
import { FindOptionsWhere } from 'typeorm/find-options/FindOptionsWhere';

export class OrderBookOperationHandler {

    public async handle(operation: OrderBookDexOperation): Promise<any> {
        if (CONFIG.VERBOSE) {
            if ('dex' in operation) {
                logInfo(`[${operation.dex}] ${operation.constructor.name} ${(operation as OrderBookDexOperation).txHash}`);
            } else if ('type' in operation && operation.type === 'OrderBookOrderCancellation') {
                logInfo(`OrderBookOrderCancellation ${(operation as any).txHash}`);
            } else {
                logInfo(`${operation.constructor.name} ${(operation as any).txHash}`);
            }
        }

        // Errors are handled within
        return this.handleOperation(operation)
            .then((savedEntity: BaseEntity | undefined) => {
                if (savedEntity) {
                    operationWs.broadcast(savedEntity);
                }

                return Promise.resolve();
            })
            .catch(() => Promise.resolve());
    }

    /**
     * Store necessary data into the DB.
     */
    private async handleOperation(operation: OrderBookDexOperation): Promise<BaseEntity | undefined> {
        if (! dbService.isInitialized) {
            return Promise.resolve(undefined);
        }

        if ('type' in operation && operation.type === 'OrderBookOrderCancellation') {
            return await this.handleCancellation(operation as OrderBookOrderCancellation);
        }

        switch (operation.constructor) {
            case OrderBookOrder:
                return await this.handleOrder(operation as OrderBookOrder);
            case OrderBookMatch:
                return await this.handleMatch(operation as OrderBookMatch);
            default:
                return Promise.reject('Encountered unknown event type.');
        }
    }

    private async handleCancellation(cancellation: OrderBookOrderCancellation): Promise<OrderBookOrder> {
        const existingOrder: OrderBookOrder | undefined = await dbService.query((manager: EntityManager) => {
            return manager.findOneBy(OrderBookOrder, {
                txHash: cancellation.txHash,
                senderPubKeyHash: cancellation.senderPubKeyHash ?? IsNull(),
                senderStakeKeyHash: cancellation.senderStakeKeyHash ?? IsNull(),
            }) ?? undefined;
        });

        if (! existingOrder) {
            return Promise.reject(`Unable to find cancelled order from ${cancellation.txHash}`);
        }

        existingOrder.isCancelled = true;

        eventService.pushEvent({
            type: 'OrderBookOrderUpdated',
            data: existingOrder,
        });

        return await dbService.transaction(async (manager: EntityManager): Promise<OrderBookOrder> => {
            return manager.save(existingOrder);
        });
    }

    /**
     * Handle an update liquidity pool state event.
     */
    private async handleOrder(order: OrderBookOrder): Promise<OrderBookOrder> {
        const existingOrderConditions: FindOptionsWhere<OrderBookOrder>[] = [
            {
                txHash: In(order.transaction?.inputs.map((input: Utxo) => input.forTxHash) ?? []),
                senderPubKeyHash: order.senderPubKeyHash,
                senderStakeKeyHash: order.senderStakeKeyHash,
            },
        ];

        if (order.identifier) {
            existingOrderConditions.push({
                identifier: order.identifier,
            });
        }

        const existingOrder: OrderBookOrder | undefined = await dbService.query((manager: EntityManager) => {
            return manager.findOneBy(OrderBookOrder, existingOrderConditions) ?? undefined;
        });

        // Update existing order
        if (existingOrder) {
            existingOrder.askedAmount = order.askedAmount;
            existingOrder.unFilledOfferAmount = order.unFilledOfferAmount;
            existingOrder.numPartialFills = order.numPartialFills + 1;
            existingOrder.txHash = order.txHash;

            eventService.pushEvent({
                type: 'OrderBookOrderUpdated',
                data: existingOrder,
            });

            return await dbService.transaction(async (manager: EntityManager): Promise<OrderBookOrder> => {
                return await manager.save(existingOrder);
            });
        }

        if (order.fromToken) {
            order.fromToken = await this.retrieveAsset(order.fromToken);
        }
        if (order.toToken) {
            order.toToken = await this.retrieveAsset(order.toToken);
        }
        order.orderBook = await this.retrieveOrderBook(
            order.dex,
            order.fromToken ?? 'lovelace',
            order.toToken ?? 'lovelace',
            order.slot,
        );

        if (! order.askedAmount) {
            order.askedAmount = Math.floor(order.originalOfferAmount / order.price);
        }

        eventService.pushEvent({
            type: 'OrderBookOrderCreated',
            data: order,
        });

        return await dbService.transaction(async (manager: EntityManager): Promise<OrderBookOrder> => {
            return await manager.save(order);
        });
    }

    /**
     * Handle a match from orders.
     */
    private async handleMatch(match: OrderBookMatch): Promise<OrderBookMatch> {
        const existingOrderConditions: FindOptionsWhere<OrderBookOrder>[] = [
            {
                txHash: In(match.transaction?.inputs.map((input: Utxo) => input.forTxHash) ?? []),
                senderPubKeyHash: Not(match.receiverPubKeyHash),
                senderStakeKeyHash: Not(match.receiverStakeKeyHash),
            },
        ];

        if (match.partialFillOrderIdentifier) {
            existingOrderConditions.push({
                identifier:  match.partialFillOrderIdentifier,
            });
        }

        if (match.consumedTxHash) {
            existingOrderConditions.push({
                txHash:  match.consumedTxHash,
            });
        }

        const existingOrders: OrderBookOrder[] | undefined = await dbService.query((manager: EntityManager) => {
            return manager.find(OrderBookOrder, {
                relations: ['fromToken', 'toToken'],
                where: existingOrderConditions,
            }) ?? undefined;
        });

        if (! existingOrders || existingOrders.length === 0) {
            return Promise.reject(`Unable to find fromOrder from match in ${match.txHash}`);
        }

        match.matchedToken = existingOrders[0].toToken;
        match.orderBook = await this.retrieveOrderBook(
            match.dex,
            existingOrders[0].fromToken ?? 'lovelace',
            existingOrders[0].toToken ?? 'lovelace',
            existingOrders[0].slot,
        );

        if (match.consumedTxHash) {
            match.matchedAmount = existingOrders.reduce((total: number, order: OrderBookOrder) => total + order.unFilledOfferAmount, 0);
            existingOrders.forEach((order: OrderBookOrder) => order.unFilledOfferAmount = 0);

        } else if (match.unFilledAmount) {
            match.matchedAmount =  existingOrders.reduce((total: number, order: OrderBookOrder) => total + order.askedAmount, 0) - match.unFilledAmount;
            existingOrders.forEach((order: OrderBookOrder) => order.unFilledOfferAmount = match.unFilledAmount);

        } else if (match.referenceOrder) {
            match.matchedAmount = existingOrders.reduce((total: number, order: OrderBookOrder) => total + order.askedAmount, 0) - match.referenceOrder.unFilledOfferAmount;
            existingOrders.forEach((order: OrderBookOrder) => order.unFilledOfferAmount -= match.unFilledAmount);
        }

        existingOrders.forEach((order: OrderBookOrder) => order.numPartialFills += 1);

        match.referenceOrder = existingOrders[0];

        return dbService.transaction(async (manager: EntityManager): Promise<OrderBookMatch> => {
            await manager.save(existingOrders)

            existingOrders.forEach((order: OrderBookOrder) => eventService.pushEvent({
                type: 'OrderBookOrderUpdated',
                data: order,
            }));
            eventService.pushEvent({
                type: 'OrderBookMatchCreated',
                data: match,
            });

            return manager.save(match)
                .then((match: OrderBookMatch) => {
                    queue.dispatch(new UpdateOrderBookTicks(match));

                    return match;
                });
        });
    }

    /**
     * Helper to retrieve an Asset instance from the DB.
     * Note - Will store new asset instance if not found.
     */
    private async retrieveAsset(asset: Asset): Promise<Asset> {
        const firstOrSaveAsset: any = async (manager: EntityManager) => {
            const existingAsset: Asset | undefined = await manager
                .findOneBy(Asset, {
                    policyId: asset.policyId,
                    nameHex: asset.nameHex,
                }) ?? undefined;

            if (existingAsset) {
                return Promise.resolve(existingAsset);
            }

            const assetMetadata: TokenMetadata | undefined = await metadataService.fetchAsset(asset.policyId, asset.nameHex)
                .catch(() => undefined);

            asset.isLpToken = asset.isLpToken ?? false;

            if (assetMetadata) {
                asset.name = assetMetadata.name.replace( /[\x00-\x08\x0E-\x1F\x7F-\uFFFF]/g, '');
                asset.decimals = assetMetadata.decimals;
                asset.ticker = assetMetadata.ticker;
                asset.logo = assetMetadata.logo;
                asset.description = assetMetadata.description.replace( /[\x00-\x08\x0E-\x1F\x7F-\uFFFF]/g, '');
                asset.isVerified = true;
            } else {
                asset.decimals = 0;
            }

            eventService.pushEvent({
                type: 'AssetCreated',
                data: asset,
            });

            return await manager.save(asset)
                .then(() => {
                    operationWs.broadcast(asset);

                    return Promise.resolve(asset);
                });
        };

        return await dbService.query(firstOrSaveAsset);
    }

    private async retrieveOrderBook(dex: Dex, tokenA: Token, tokenB: Token, slot: number): Promise<OrderBook> {
        const aToken: Token = tokenA === 'lovelace'
            ? tokenA
            : (tokenB === 'lovelace' ? tokenB : tokenA);
        const bToken: Asset = tokensMatch(aToken, tokenA)
            ? tokenB as Asset
            : tokenA as Asset;

        const existingBook: OrderBook | undefined = await dbService.query(async (manager: EntityManager) => {
           return await manager
               .findOne(OrderBook, {
                   relations: ['tokenA', 'tokenB'],
                    where: {
                        dex: dex,
                        tokenA: aToken === 'lovelace'
                            ? IsNull()
                            : {
                                policyId: aToken.policyId,
                                nameHex: aToken.nameHex,
                            },
                        tokenB: {
                            policyId: bToken.policyId,
                            nameHex: bToken.nameHex,
                        }
                    }
               }) ?? undefined;
        });

        if (existingBook) {
            return Promise.resolve(existingBook);
        }

        return await dbService.transaction(async (manager: EntityManager): Promise<OrderBook> => {
            const orderBook: OrderBook = OrderBook.make(
                dex,
                aToken === 'lovelace' ? undefined : aToken,
                bToken,
                slot,
            );

            eventService.pushEvent({
                type: 'OrderBookCreated',
                data: orderBook,
            });

            return await manager.save(orderBook)
                .then(() => {
                    operationWs.broadcast(orderBook);

                    return Promise.resolve(orderBook);
                });
        });
    }

}
