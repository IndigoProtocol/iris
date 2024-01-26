import { BaseApiController } from './BaseApiController';
import express from 'express';
import { dbApiService } from '../../apiServices';
import { EntityManager } from 'typeorm';
import { Sync } from '../../db/entities/Sync';
import { SyncResource } from '../resources/SyncResource';

export class SyncController extends BaseApiController {

    bootRoutes(): void {
        this.router.get(`${this.basePath}`, this.latestSync);
    }

    private latestSync(request: express.Request, response: express.Response) {
        dbApiService.query((manager: EntityManager) => {
            return manager.findOne(Sync, {
                where: {
                    id: 1,
                },
            });
        }).then((sync: Sync) => {
            const resource: SyncResource = new SyncResource();

            response.send(resource.toJson(sync));
        });
    }

}
