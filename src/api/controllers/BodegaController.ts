import { BaseApiController } from './BaseApiController';
import express from 'express';
import { dbApiService } from '../../apiServices';
import { EntityManager } from 'typeorm';
import { PredictionMarket } from '../../db/entities/PredictionMarket';
import { PredictionMarketResource } from '../resources/PredictionMarketResource';
import { PredictionMarketHistory } from '../../db/entities/PredictionMarketHistory';
import { PredictionMarketHistoryResource } from '../resources/PredictionMarketHistoryResource';

const MAX_PER_PAGE: number = 100;

export class BodegaController extends BaseApiController {

    bootRoutes(): void {
        this.router.get(`${this.basePath}/markets`, this.markets);
        this.router.get(`${this.basePath}/markets/:uuid/history`, this.history);
    }

    private markets(request: express.Request, response: express.Response) {
        const {
            page,
            limit,
        } = request.query;

        const take: number = Math.min(Number((limit ? +limit : undefined) || MAX_PER_PAGE), MAX_PER_PAGE);
        const skip: number = (Math.max(Number((page ? +page : undefined) || 1), 1) - 1) * take;

        dbApiService.query((manager: EntityManager) => {
            return manager.findAndCount(PredictionMarket, {
                take: take,
                skip: skip,
            });
        }).then(([markets, total]) => {
            const resource: PredictionMarketResource = new PredictionMarketResource();

            response.send(super.formatPaginatedResponse(
                Number(page ?? 1),
                Number(limit ?? MAX_PER_PAGE),
                Math.ceil(total / take),
                resource.manyToJson(markets)
            ));
        }).catch(() => response.send(super.failResponse('Unable to retrieve markets')));
    }

    private history(request: express.Request, response: express.Response) {
        const {
            uuid,
        } = request.params;
        const {
            page,
            limit,
        } = request.query;

        const take: number = Math.min(Number((limit ? +limit : undefined) || MAX_PER_PAGE), MAX_PER_PAGE);
        const skip: number = (Math.max(Number((page ? +page : undefined) || 1), 1) - 1) * take;

        dbApiService.query((manager: EntityManager) => {
            return manager.findAndCount(PredictionMarketHistory, {
                where: {
                    uuid,
                },
                order: {
                    slot: 'desc',
                },
                take: take,
                skip: skip,
            });
        }).then(([history, total]) => {
            const resource: PredictionMarketHistoryResource = new PredictionMarketHistoryResource();

            response.send(super.formatPaginatedResponse(
                Number(page ?? 1),
                Number(limit ?? MAX_PER_PAGE),
                Math.ceil(total / take),
                resource.manyToJson(history)
            ));
        }).catch(() => response.send(super.failResponse('Unable to retrieve market history')));
    }

}
