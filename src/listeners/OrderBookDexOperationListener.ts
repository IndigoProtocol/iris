import { BaseEventListener } from './BaseEventListener';
import { Dex, IndexerEventType } from '../constants';
import { IndexerEvent, OrderBookDexOperation, OrderBookOrderCancellation, TokenMetadata } from '../types';
import { logInfo } from '../logger';
import { dbService, eventService, metadataService, operationWs, queue } from '../indexerServices';
import { Asset, Token } from '../db/entities/Asset';
import { BaseEntity, EntityManager, IsNull } from 'typeorm';
import CONFIG from '../config';
import { OrderBookOrder } from '../db/entities/OrderBookOrder';
import { OrderBook } from '../db/entities/OrderBook';
import { tokensMatch } from '../utils';
import { OrderBookMatch } from '../db/entities/OrderBookMatch';
import { UpdateOrderBookTicks } from '../jobs/UpdateOrderBookTicks';

export class OrderBookDexOperationListener extends BaseEventListener {

    public listenFor: IndexerEventType[] = [
        IndexerEventType.OrderBookDexOperation,
    ];

    public async onEvent(event: IndexerEvent): Promise<any> {
        if (CONFIG.VERBOSE) {
            if ('dex' in event.data) {
                logInfo(`[${event.data.dex}] ${event.data.constructor.name} ${(event.data as OrderBookDexOperation).txHash}`);
            } else if ('type' in event.data && event.data.type === 'OrderBookOrderCancellation') {
                logInfo(`OrderBookOrderCancellation ${(event.data as any).txHash}`);
            } else {
                logInfo(`${event.data.constructor.name} ${(event.data as any).txHash}`);
            }
        }

        // Errors are handled within
        return this.eventHandler(event)
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
    private async eventHandler(event: IndexerEvent): Promise<BaseEntity | undefined> {
        if (! dbService.isInitialized) {
            return Promise.resolve(undefined);
        }

        if ('type' in event.data && event.data.type === 'OrderBookOrderCancellation') {
            return await this.handleCancellation(event.data as OrderBookOrderCancellation);
        }

        switch (event.data.constructor) {
            case OrderBookOrder:
                return await this.handleOrder(event.data as OrderBookOrder);
            case OrderBookMatch:
                return await this.handleMatch(event.data as OrderBookMatch);
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

        return await dbService.transaction(async (manager: EntityManager): Promise<OrderBookOrder> => {
            return manager.save(existingOrder);
        });
    }

    /**
     * Handle an update liquidity pool state event.
     */
    private async handleOrder(order: OrderBookOrder): Promise<OrderBookOrder> {
        const existingOrder: OrderBookOrder | undefined = await dbService.query((manager: EntityManager) => {
            return manager.findOneBy(OrderBookOrder, {
                identifier: order.identifier,
            }) ?? undefined;
        });

        // Update existing order
        if (existingOrder) {
            existingOrder.unFilledOfferAmount = order.unFilledOfferAmount;
            existingOrder.numPartialFills = order.numPartialFills;
            existingOrder.txHash = order.txHash;

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

        return await dbService.transaction(async (manager: EntityManager): Promise<OrderBookOrder> => {
            return await manager.save(order);
        });
    }

    /**
     * Handle a match from orders.
     */
    private async handleMatch(match: OrderBookMatch): Promise<OrderBookMatch> {
        const existingOrder: OrderBookOrder | undefined = await dbService.query((manager: EntityManager) => {
            return manager.findOne(OrderBookOrder, {
                relations: ['toToken'],
                where: [
                    {
                        identifier: match.partialFillOrderIdentifier,
                    },
                    {
                        txHash: match.consumedTxHash,
                    },
                ]
            }) ?? undefined;
        });

        if (! existingOrder) {
            return Promise.reject(`Unable to find fromOrder from match in ${match.txHash}`);
        }

        match.matchedToken = existingOrder.toToken;
        match.orderBook = await this.retrieveOrderBook(
            match.dex,
            existingOrder.fromToken ?? 'lovelace',
            existingOrder.toToken ?? 'lovelace',
            existingOrder.slot,
        );

        return dbService.transaction(async (manager: EntityManager): Promise<OrderBookMatch> => {
            if (match.consumedTxHash) {
                match.matchedAmount = existingOrder.unFilledOfferAmount;

                existingOrder.unFilledOfferAmount = 0;
            }
            if (match.referenceOrder) {
                match.matchedAmount = existingOrder.unFilledOfferAmount - match.referenceOrder.unFilledOfferAmount;
                existingOrder.unFilledOfferAmount -= match.matchedAmount;
            }

            existingOrder.numPartialFills += 1;

            match.referenceOrder = existingOrder;

            if (match.txHash === '7b70d2bf13360d4cba98c8adbb9f884b791d6e6678f4a8c30418eb717043ef5f') {
                console.log(existingOrder)
            }

            await manager.save(existingOrder)
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

            return await manager.save(asset)
                .then(() => {
                    operationWs.broadcast(asset);
                    eventService.pushEvent({
                        type: IndexerEventType.Asset,
                        data: asset,
                    });

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

            return await manager.save(orderBook)
                .then(() => {
                    operationWs.broadcast(orderBook);
                    eventService.pushEvent({
                        type: IndexerEventType.OrderBook,
                        data: orderBook,
                    });

                    return Promise.resolve(orderBook);
                });
        });
    }

}
