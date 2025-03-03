import { BaseApiController } from './BaseApiController';
import express from 'express';
import { dbApiService } from '../../apiServices';
import { Brackets, EntityManager } from 'typeorm';
import { OrderBook } from '../../db/entities/OrderBook';
import { OrderBookResource } from '../resources/OrderBookResource';
import { OrderBookOrder } from '../../db/entities/OrderBookOrder';
import { OrderBookOrderResource } from '../resources/OrderBookOrderResource';
import { TickInterval } from '../../constants';
import { OrderBookTick } from '../../db/entities/OrderBookTick';
import { OrderBookTickResource } from '../resources/OrderBookTickResource';
import { OrderBookMatch } from '../../db/entities/OrderBookMatch';

const MAX_PER_PAGE: number = 100;

export class OrderBookController extends BaseApiController {
  public bootRoutes(): void {
    this.router.get(`${this.basePath}`, this.orderBooks);
    this.router.post(`${this.basePath}`, this.orderBooks);

    this.router.get(`${this.basePath}/:identifier/ticks`, this.ticks);
    this.router.get(`${this.basePath}/:identifier/buy-orders`, this.buyOrders);
    this.router.get(
      `${this.basePath}/:identifier/sell-orders`,
      this.sellOrders
    );

    this.router.post(`${this.basePath}/analytics/prices`, this.orderBookPrices);
  }

  private orderBooks(request: express.Request, response: express.Response) {
    const { identifier, dex, tokenA, tokenB } = request.body;
    const { page, limit } = request.query;

    const take: number = Math.min(
      Number((limit ? +limit : undefined) || MAX_PER_PAGE),
      MAX_PER_PAGE
    );
    const skip: number =
      (Math.max(Number((page ? +page : undefined) || 1), 1) - 1) * take;

    const [tokenAPolicyId, tokenANameHex] =
      tokenA && tokenA !== 'lovelace'
        ? (tokenA as string).split('.')
        : [null, null];
    const [tokenBPolicyId, tokenBNameHex] = tokenB
      ? (tokenB as string).split('.')
      : [null, null];

    return dbApiService
      .query((manager: EntityManager) => {
        return manager
          .createQueryBuilder(OrderBook, 'books')
          .leftJoinAndSelect('books.tokenA', 'tokenA')
          .leftJoinAndSelect('books.tokenB', 'tokenB')
          .where(
            new Brackets((query) => {
              if (identifier) {
                query.andWhere('books.identifier = :identifier', {
                  identifier: identifier,
                });
              }

              if (dex) {
                query.andWhere('books.dex = :dex', {
                  dex: dex,
                });
              }

              if (tokenA === 'lovelace') {
                query.andWhere('books.tokenA IS NULL');
              } else if (tokenAPolicyId && tokenANameHex) {
                query
                  .andWhere('tokenA.policyId = :policyId', {
                    policyId: tokenAPolicyId,
                  })
                  .andWhere('tokenA.nameHex = :nameHex', {
                    nameHex: tokenANameHex,
                  });
              }

              if (tokenBPolicyId && tokenBNameHex) {
                query
                  .andWhere('tokenB.policyId = :policyId', {
                    policyId: tokenBPolicyId,
                  })
                  .andWhere('tokenB.nameHex = :nameHex', {
                    nameHex: tokenBNameHex,
                  });
              }

              return query;
            })
          )
          .limit(take)
          .offset(skip)
          .getManyAndCount();
      })
      .then(([books, total]) => {
        const resource: OrderBookResource = new OrderBookResource();

        response.send(
          super.formatPaginatedResponse(
            Number(page ?? 1),
            Number(limit ?? MAX_PER_PAGE),
            Math.ceil(total / take),
            resource.manyToJson(books)
          )
        );
      })
      .catch(() =>
        response.send(super.failResponse('Unable to retrieve order books'))
      );
  }

  private ticks(request: express.Request, response: express.Response) {
    const { identifier } = request.params;
    const { resolution, fromTime, toTime } = request.query;

    if (!identifier) {
      return response.send(super.failResponse("Must supply 'identifier'"));
    }
    if (
      !(Object.values(TickInterval) as string[]).includes(resolution as string)
    ) {
      return response.send(
        super.failResponse(
          `Must supply 'resolution' as ${Object.values(TickInterval).join(',')}`
        )
      );
    }

    const fetchTicks: any = (manager: EntityManager) => {
      return manager
        .findOneBy(OrderBook, {
          identifier,
        })
        .then((book: OrderBook | null) => {
          if (!book) {
            return Promise.reject('Unable to find order book');
          }

          return manager
            .createQueryBuilder(OrderBookTick, 'ticks')
            .where(
              new Brackets((query) => {
                query
                  .where('ticks.orderBookId = :orderBookId', {
                    orderBookId: book.id,
                  })
                  .andWhere('ticks.resolution = :resolution', {
                    resolution,
                  });

                if (fromTime && !isNaN(parseInt(fromTime as string))) {
                  query.andWhere('ticks.time >= :fromTime', {
                    fromTime,
                  });
                }

                if (toTime && !isNaN(parseInt(toTime as string))) {
                  query.andWhere('ticks.time < :toTime', {
                    toTime,
                  });
                }

                return query;
              })
            )
            .orderBy('time', 'ASC')
            .getMany();
        });
    };

    return dbApiService
      .transaction(fetchTicks)
      .then((ticks: OrderBookTick[]) => {
        const resource: OrderBookTickResource = new OrderBookTickResource();

        response.send(resource.manyToJson(ticks));
      })
      .catch((e) => response.send(super.failResponse(e)));
  }

  private buyOrders(request: express.Request, response: express.Response) {
    const { identifier } = request.params;

    if (!identifier) {
      return response.send(super.failResponse("Must supply 'identifier'"));
    }

    return dbApiService
      .query(async (manager: EntityManager) => {
        const orderBook: OrderBook | null = await manager.findOneBy(OrderBook, {
          identifier,
        });

        if (!orderBook) {
          return response.send(
            super.failResponse(
              `Unable to find order book with identifier ${identifier}`
            )
          );
        }

        return manager
          .createQueryBuilder(OrderBookOrder, 'orders')
          .leftJoinAndSelect('orders.fromToken', 'fromToken')
          .where('orders.orderBookId = :orderBookId', {
            orderBookId: orderBook.id,
          })
          .andWhere(
            new Brackets((query) => {
              if (orderBook.tokenA) {
                query.andWhere('orders.fromTokenId = :tokenA', {
                  tokenA: orderBook.tokenA?.id ?? null,
                });
              } else {
                query.andWhere('orders.fromTokenId IS NULL');
              }

              return query;
            })
          )
          .andWhere('orders.isCancelled = 0')
          .andWhere("orders.unFilledOfferAmount != '0'")
          .getMany();
      })
      .then((orders: OrderBookOrder[]) => {
        const resource: OrderBookOrderResource = new OrderBookOrderResource();

        orders.forEach((order: OrderBookOrder) => {
          delete order.fromToken;
        });

        return response.send(resource.manyToJson(orders));
      })
      .catch(() =>
        response.send(
          super.failResponse('Unable to retrieve order book orders')
        )
      );
  }

  private sellOrders(request: express.Request, response: express.Response) {
    const { identifier } = request.params;

    if (!identifier) {
      return response.send(super.failResponse("Must supply 'identifier'"));
    }

    return dbApiService
      .query(async (manager: EntityManager) => {
        const orderBook: OrderBook | null = await manager.findOneBy(OrderBook, {
          identifier,
        });

        if (!orderBook) {
          return response.send(
            super.failResponse(
              `Unable to find order book with identifier ${identifier}`
            )
          );
        }

        return manager
          .createQueryBuilder(OrderBookOrder, 'orders')
          .leftJoinAndSelect('orders.fromToken', 'fromToken')
          .where('orders.orderBookId = :orderBookId', {
            orderBookId: orderBook.id,
          })
          .andWhere('orders.fromTokenId = :tokenBId', {
            tokenBId: orderBook.tokenB.id,
          })
          .andWhere('orders.isCancelled = 0')
          .andWhere("orders.unFilledOfferAmount != '0'")
          .getMany();
      })
      .then((orders: OrderBookOrder[]) => {
        const resource: OrderBookOrderResource = new OrderBookOrderResource();

        orders.forEach((order: OrderBookOrder) => {
          delete order.fromToken;
        });

        return response.send(resource.manyToJson(orders));
      })
      .catch(() =>
        response.send(
          super.failResponse('Unable to retrieve order book orders')
        )
      );
  }

  private orderBookPrices(
    request: express.Request,
    response: express.Response
  ) {
    const { identifiers } = request.body;

    if (!identifiers || identifiers.length === 0) {
      return response.send([]);
    }

    return dbApiService
      .query((manager: EntityManager) => {
        return manager
          .createQueryBuilder(OrderBook, 'books')
          .leftJoinAndSelect('books.tokenA', 'tokenA')
          .leftJoinAndSelect('books.tokenB', 'tokenB')
          .leftJoinAndMapOne(
            'books.day_tick',
            OrderBookTick,
            'day_tick',
            'day_tick.orderBookId = books.id AND (day_tick.id = (SELECT id FROM order_book_ticks WHERE orderBookId = books.id AND resolution = :resolution AND time >= (UNIX_TIMESTAMP() - :seconds) ORDER BY time ASC LIMIT 1))',
            {
              resolution: TickInterval.Hour,
              seconds: 60 * 60 * 24,
            }
          )
          .leftJoinAndMapOne(
            'books.hour_tick',
            OrderBookTick,
            'hour_tick',
            'hour_tick.orderBookId = books.id AND (hour_tick.id = (SELECT id FROM order_book_ticks WHERE orderBookId = books.id AND resolution = :hourResolution AND time >= (UNIX_TIMESTAMP() - :hourSeconds) ORDER BY time ASC LIMIT 1))',
            {
              hourResolution: TickInterval.Hour,
              hourSeconds: 60 * 60,
            }
          )
          .leftJoinAndMapOne(
            'books.last_match',
            OrderBookMatch,
            'last_match',
            'last_match.orderBookId = books.id AND (last_match.id = (SELECT MAX(id) FROM order_book_matches WHERE orderBookId = books.id))'
          )
          .leftJoinAndSelect('last_match.referenceOrder', 'referenceOrder')
          .where('books.identifier IN (:identifiers)', {
            identifiers,
          })
          .getMany();
      })
      .then((results: OrderBook[]) => {
        response.send(
          results.reduce((prices: Object[], entry: any) => {
            const price: number = entry.last_match.referenceOrder.price;

            prices.push({
              identifier: entry.identifier,
              price: price,
              dayLow: entry.day_tick
                ? Math.min(entry.day_tick.low, price)
                : price,
              dayHigh: entry.day_tick
                ? Math.max(entry.day_tick.high, price)
                : price,
              dayChange: !entry.day_tick
                ? 0
                : ((price - entry.day_tick.close) / entry.day_tick.close) * 100,
              hourChange: !entry.hour_tick
                ? 0
                : ((price - entry.hour_tick.close) / entry.hour_tick.close) *
                  100,
            });

            return prices;
          }, [])
        );
      })
      .catch(() =>
        response.send(
          super.failResponse('Unable to retrieve order book prices')
        )
      );
  }
}
