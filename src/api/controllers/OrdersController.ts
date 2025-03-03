import { BaseApiController } from './BaseApiController';
import express from 'express';
import { dbApiService } from '../../apiServices';
import { Brackets, EntityManager } from 'typeorm';
import { LiquidityPoolSwap } from '../../db/entities/LiquidityPoolSwap';
import { OperationStatus } from '../../db/entities/OperationStatus';
import { LiquidityPoolSwapResource } from '../resources/LiquidityPoolSwapResource';
import { LiquidityPoolDeposit } from '../../db/entities/LiquidityPoolDeposit';
import { LiquidityPoolDepositResource } from '../resources/LiquidityPoolDepositResource';
import { LiquidityPoolWithdraw } from '../../db/entities/LiquidityPoolWithdraw';
import { LiquidityPoolWithdrawResource } from '../resources/LiquidityPoolWithdrawResource';
import { Asset } from '../../db/entities/Asset';
import { AssetResource } from '../resources/AssetResource';

const MAX_PER_PAGE: number = 100;

export class OrdersController extends BaseApiController {
  bootRoutes(): void {
    this.router.post(`${this.basePath}/swaps`, this.swaps);
    this.router.post(`${this.basePath}/deposits`, this.deposits);
    this.router.post(`${this.basePath}/withdraws`, this.withdraws);

    this.router.post(`${this.basePath}/swaps/assets`, this.swapAssets);
    this.router.post(`${this.basePath}/deposits/assets`, this.depositAssets);
  }

  private swaps(request: express.Request, response: express.Response) {
    const { pubKeyHashes, stakeKeyHashes } = request.body;
    const { poolIdentifier, type, token, page, limit } = request.query;

    const take: number = Math.min(
      Number((limit ? +limit : undefined) || MAX_PER_PAGE),
      MAX_PER_PAGE
    );
    const skip: number =
      (Math.max(Number((page ? +page : undefined) || 1), 1) - 1) * take;

    const [policyId, nameHex] = token
      ? (token as string).split('.')
      : [null, null];

    if (!pubKeyHashes && !stakeKeyHashes) {
      response.send(
        super.formatPaginatedResponse(
          Number(page ?? 1),
          Number(limit ?? MAX_PER_PAGE),
          1,
          []
        )
      );
    }

    dbApiService
      .query((manager: EntityManager) => {
        return manager
          .createQueryBuilder(LiquidityPoolSwap, 'swaps')
          .leftJoinAndSelect('swaps.swapInToken', 'swapInToken')
          .leftJoinAndSelect('swaps.swapOutToken', 'swapOutToken')
          .leftJoinAndSelect('swaps.liquidityPool', 'liquidityPool')
          .leftJoinAndSelect('liquidityPool.tokenA', 'tokenA')
          .leftJoinAndSelect('liquidityPool.tokenB', 'tokenB')
          .leftJoinAndMapMany(
            'swaps.statuses',
            OperationStatus,
            'status',
            'operationId = swaps.id AND operationType = :operationType',
            {
              operationType: LiquidityPoolSwap.name,
            }
          )
          .andWhere(
            new Brackets((query) => {
              query.andWhere(
                new Brackets((query1) => {
                  if (pubKeyHashes && pubKeyHashes.length > 0) {
                    query1.orWhere('swaps.senderPubKeyHash IN(:...pkHashes)', {
                      pkHashes: pubKeyHashes,
                    });
                  }

                  if (stakeKeyHashes && stakeKeyHashes.length > 0) {
                    query1.orWhere(
                      'swaps.senderStakeKeyHash IN(:...skHashes)',
                      {
                        skHashes: stakeKeyHashes,
                      }
                    );
                  }
                })
              );

              if (poolIdentifier) {
                query.andWhere('liquidityPool.identifier = :identifier', {
                  identifier: poolIdentifier,
                });
              }

              if (policyId && nameHex) {
                query.andWhere(
                  new Brackets((query1) => {
                    query1
                      .andWhere(
                        new Brackets((query2) => {
                          query2
                            .andWhere('swapInToken.policyId = :policyId', {
                              policyId,
                            })
                            .andWhere('swapInToken.nameHex = :nameHex', {
                              nameHex,
                            });
                        })
                      )
                      .orWhere(
                        new Brackets((query2) => {
                          query2
                            .andWhere('swapOutToken.policyId = :policyId', {
                              policyId,
                            })
                            .andWhere('swapOutToken.nameHex = :nameHex', {
                              nameHex,
                            });
                        })
                      );
                  })
                );
              }

              if (type && type === 'buy') {
                query.andWhere(
                  new Brackets((query1) => {
                    query1
                      .andWhere('swaps.swapInTokenId = liquidityPool.tokenAId')
                      .orWhere(
                        'swaps.swapInToken IS NULL AND liquidityPool.tokenA IS NULL'
                      );
                  })
                );
              }
              if (type && type === 'sell') {
                query.andWhere(
                  new Brackets((query1) => {
                    query1
                      .andWhere('swaps.swapInTokenId != liquidityPool.tokenAId')
                      .orWhere(
                        'swaps.swapInToken IS NOT NULL AND liquidityPool.tokenA IS NULL'
                      );
                  })
                );
              }

              return query;
            })
          )
          .orderBy('swaps.id', 'DESC')
          .take(take)
          .skip(skip)
          .getManyAndCount();
      })
      .then(([orders, total]) => {
        const resource: LiquidityPoolSwapResource =
          new LiquidityPoolSwapResource();

        response.send(
          super.formatPaginatedResponse(
            Number(page ?? 1),
            Number(limit ?? MAX_PER_PAGE),
            Math.ceil(total / take),
            resource.manyToJson(orders)
          )
        );
      })
      .catch(() =>
        response.send(super.failResponse('Unable to retrieve swap orders'))
      );
  }

  private deposits(request: express.Request, response: express.Response) {
    const { pubKeyHashes, stakeKeyHashes } = request.body;
    const { poolIdentifier, token, page, limit } = request.query;

    const take: number = Math.min(
      Number((limit ? +limit : undefined) || MAX_PER_PAGE),
      MAX_PER_PAGE
    );
    const skip: number =
      (Math.max(Number((page ? +page : undefined) || 1), 1) - 1) * take;

    const [policyId, nameHex] = token
      ? (token as string).split('.')
      : [null, null];

    if (!pubKeyHashes && !stakeKeyHashes) {
      response.send(
        super.formatPaginatedResponse(
          Number(page ?? 1),
          Number(limit ?? MAX_PER_PAGE),
          1,
          []
        )
      );
    }

    dbApiService
      .query((manager: EntityManager) => {
        return manager
          .createQueryBuilder(LiquidityPoolDeposit, 'deposits')
          .leftJoinAndSelect('deposits.depositAToken', 'depositAToken')
          .leftJoinAndSelect('deposits.depositBToken', 'depositBToken')
          .leftJoinAndSelect('deposits.liquidityPool', 'liquidityPool')
          .leftJoinAndSelect('liquidityPool.tokenA', 'tokenA')
          .leftJoinAndSelect('liquidityPool.tokenB', 'tokenB')
          .leftJoinAndMapMany(
            'deposits.statuses',
            OperationStatus,
            'status',
            'operationId = deposits.id AND operationType = :operationType',
            {
              operationType: LiquidityPoolDeposit.name,
            }
          )
          .andWhere(
            new Brackets((query) => {
              if (poolIdentifier) {
                query.andWhere('liquidityPool.identifier = :identifier', {
                  identifier: poolIdentifier,
                });
              }

              if (pubKeyHashes && pubKeyHashes.length > 0) {
                query.andWhere('deposits.senderPubKeyHash IN(:...pkHashes)', {
                  pkHashes: pubKeyHashes,
                });
              }

              if (stakeKeyHashes && stakeKeyHashes.length > 0) {
                query.andWhere('deposits.senderStakeKeyHash IN(:...skHashes)', {
                  skHashes: stakeKeyHashes,
                });
              }

              if (policyId && nameHex) {
                query
                  .andWhere(
                    new Brackets((query1) => {
                      query1
                        .where('depositAToken.policyId = :policyId', {
                          policyId,
                        })
                        .andWhere('depositAToken.nameHex = :nameHex', {
                          nameHex,
                        });
                    })
                  )
                  .orWhere(
                    new Brackets((query1) => {
                      query1
                        .where('depositBToken.policyId = :policyId', {
                          policyId,
                        })
                        .andWhere('depositBToken.nameHex = :nameHex', {
                          nameHex,
                        });
                    })
                  );
              }

              return query;
            })
          )
          .orderBy('deposits.id', 'DESC')
          .take(take)
          .skip(skip)
          .getManyAndCount();
      })
      .then(([deposits, total]) => {
        const resource: LiquidityPoolDepositResource =
          new LiquidityPoolDepositResource();

        response.send(
          super.formatPaginatedResponse(
            Number(page ?? 1),
            Number(limit ?? MAX_PER_PAGE),
            Math.ceil(total / take),
            resource.manyToJson(deposits)
          )
        );
      })
      .catch(() =>
        response.send(super.failResponse('Unable to retrieve deposit orders'))
      );
  }

  private withdraws(request: express.Request, response: express.Response) {
    const { pubKeyHashes, stakeKeyHashes } = request.body;
    const { poolIdentifier, page, limit } = request.query;

    const take: number = Math.min(
      Number((limit ? +limit : undefined) || MAX_PER_PAGE),
      MAX_PER_PAGE
    );
    const skip: number =
      (Math.max(Number((page ? +page : undefined) || 1), 1) - 1) * take;

    if (!pubKeyHashes && !stakeKeyHashes) {
      response.send(
        super.formatPaginatedResponse(
          Number(page ?? 1),
          Number(limit ?? MAX_PER_PAGE),
          1,
          []
        )
      );
    }

    dbApiService
      .query((manager: EntityManager) => {
        return manager
          .createQueryBuilder(LiquidityPoolWithdraw, 'withdraws')
          .leftJoinAndSelect('withdraws.lpToken', 'lpToken')
          .leftJoinAndSelect('withdraws.liquidityPool', 'liquidityPool')
          .leftJoinAndSelect('liquidityPool.tokenA', 'tokenA')
          .leftJoinAndSelect('liquidityPool.tokenB', 'tokenB')
          .leftJoinAndMapMany(
            'withdraws.statuses',
            OperationStatus,
            'status',
            'operationId = withdraws.id AND operationType = :operationType',
            {
              operationType: LiquidityPoolWithdraw.name,
            }
          )
          .andWhere(
            new Brackets((query) => {
              if (poolIdentifier) {
                query.andWhere('liquidityPool.identifier = :identifier', {
                  identifier: poolIdentifier,
                });
              }

              if (pubKeyHashes && pubKeyHashes.length > 0) {
                query.andWhere('withdraws.senderPubKeyHash IN(:...pkHashes)', {
                  pkHashes: pubKeyHashes,
                });
              }

              if (stakeKeyHashes && stakeKeyHashes.length > 0) {
                query.andWhere(
                  'withdraws.senderStakeKeyHash IN(:...skHashes)',
                  {
                    skHashes: stakeKeyHashes,
                  }
                );
              }

              return query;
            })
          )
          .orderBy('withdraws.id', 'DESC')
          .take(take)
          .skip(skip)
          .getManyAndCount();
      })
      .then(([withdraws, total]) => {
        const resource: LiquidityPoolWithdrawResource =
          new LiquidityPoolWithdrawResource();

        response.send(
          super.formatPaginatedResponse(
            Number(page ?? 1),
            Number(limit ?? MAX_PER_PAGE),
            Math.ceil(total / take),
            resource.manyToJson(withdraws)
          )
        );
      })
      .catch(() =>
        response.send(super.failResponse('Unable to retrieve deposit orders'))
      );
  }

  private swapAssets(request: express.Request, response: express.Response) {
    const { pubKeyHashes } = request.body;

    dbApiService
      .query((manager: EntityManager) => {
        return manager
          .createQueryBuilder(LiquidityPoolSwap, 'swaps')
          .select([
            'swaps.swapInToken',
            'swaps.swapOutToken',
            'swaps.senderPubKeyHash',
          ])
          .leftJoinAndSelect('swaps.swapInToken', 'orderSwapInToken')
          .leftJoinAndSelect('swaps.swapOutToken', 'orderSwapOutToken')
          .where('swaps.senderPubKeyHash IN(:...hashes)', {
            hashes: pubKeyHashes,
          })
          .getMany();
      })
      .then((orders: LiquidityPoolSwap[]) => {
        const resource: AssetResource = new AssetResource();

        const assets: Asset[] = orders.reduce(
          (assets: Asset[], order: LiquidityPoolSwap) => {
            const assetIds: number[] = assets.map((asset: Asset) => asset.id);

            if (order.swapInToken && !assetIds.includes(order.swapInToken.id)) {
              assets.push(order.swapInToken);
            }
            if (
              order.swapOutToken &&
              !assetIds.includes(order.swapOutToken.id)
            ) {
              assets.push(order.swapOutToken);
            }

            return assets;
          },
          []
        );

        response.send(resource.manyToJson(assets));
      })
      .catch(() =>
        response.send(
          super.failResponse('Unable to retrieve swap order assets')
        )
      );
  }

  private depositAssets(request: express.Request, response: express.Response) {
    const { pubKeyHashes } = request.body;

    dbApiService
      .query((manager: EntityManager) => {
        return manager
          .createQueryBuilder(LiquidityPoolSwap, 'deposits')
          .select([
            'deposits.depositAToken',
            'deposits.depositBToken',
            'swaps.senderPubKeyHash',
          ])
          .leftJoinAndSelect('deposits.depositAToken', 'depositAToken')
          .leftJoinAndSelect('deposits.depositBToken', 'depositBToken')
          .where('deposits.senderPubKeyHash IN(:...hashes)', {
            hashes: pubKeyHashes,
          })
          .getMany();
      })
      .then((orders: LiquidityPoolDeposit[]) => {
        const resource: AssetResource = new AssetResource();

        const assets: Asset[] = orders.reduce(
          (assets: Asset[], order: LiquidityPoolDeposit) => {
            const assetIds: number[] = assets.map((asset: Asset) => asset.id);

            if (
              order.depositAToken &&
              !assetIds.includes(order.depositAToken.id)
            ) {
              assets.push(order.depositAToken);
            }
            if (
              order.depositBToken &&
              !assetIds.includes(order.depositBToken.id)
            ) {
              assets.push(order.depositBToken);
            }

            return assets;
          },
          []
        );

        response.send(resource.manyToJson(assets));
      })
      .catch(() =>
        response.send(
          super.failResponse('Unable to retrieve deposit order assets')
        )
      );
  }
}
