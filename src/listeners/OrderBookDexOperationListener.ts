import { BaseEventListener } from './BaseEventListener';
import { Dex, IndexerEventType } from '../constants';
import { IndexerEvent,TokenMetadata } from '../types';
import { logInfo } from '../logger';
import { dbService, metadataService, operationWs } from '../indexerServices';
import { Asset, Token } from '../db/entities/Asset';
import { BaseEntity, EntityManager, IsNull } from 'typeorm';
import CONFIG from '../config';
import { OrderBookOrder } from '../db/entities/OrderBookOrder';
import { OrderBook } from '../db/entities/OrderBook';
import { tokensMatch } from '../utils';
import { OrderBookMatch } from '../db/entities/OrderBookMatch';

export class OrderBookDexOperationListener extends BaseEventListener {

    public listenFor: IndexerEventType[] = [
        IndexerEventType.OrderBookDexOperation,
    ];

    public async onEvent(event: IndexerEvent): Promise<any> {
        if (CONFIG.VERBOSE) {
            if ('dex' in event.data) {
                logInfo(`[${event.data.dex}] ${event.data.constructor.name} ${event.data.txHash}`);
            } else {
                logInfo(`${event.data.constructor.name} ${event.data.txHash}`);
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

        switch (event.data.constructor) {
            case OrderBookOrder:
                return await this.handleOrder(event.data as OrderBookOrder);
            case OrderBookMatch:
                return await this.handleMatch(event.data as OrderBookMatch);
            default:
                return Promise.reject('Encountered unknown event type.');
        }
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
            return await dbService.transaction(async (manager: EntityManager): Promise<OrderBookOrder> => {
                await manager.update(OrderBookOrder, { id: order.id }, {
                    unFilledOfferAmount: order.unFilledOfferAmount,
                    numPartialFills: order.numPartialFills,
                });

                return order;
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

        return await dbService.transaction(async (manager: EntityManager): Promise<OrderBookMatch> => {
            if (match.consumedTxHash) {
                match.matchedAmount = existingOrder.unFilledOfferAmount;

                await manager.update(OrderBookOrder, { id: existingOrder.id }, {
                    unFilledOfferAmount: 0,
                });
            }
            if (match.referenceOrder) {
                match.matchedAmount = existingOrder.unFilledOfferAmount - match.referenceOrder.unFilledOfferAmount;
            }

            match.referenceOrder = existingOrder;

            return await manager.save(match);
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
                asset.name = assetMetadata.name;
                asset.decimals = assetMetadata.decimals;
                asset.ticker = assetMetadata.ticker;
                asset.logo = assetMetadata.logo;
                asset.description = assetMetadata.description;
                asset.isVerified = true;
            } else {
                asset.decimals = 0;
            }

            return await manager.save(asset);
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
            return await manager.save(
                OrderBook.make(
                    dex,
                    aToken === 'lovelace' ? undefined : aToken,
                    bToken,
                    slot,
                )
            );
        });
    }

}
