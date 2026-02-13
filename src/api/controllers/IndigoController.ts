import { BaseApiController } from './BaseApiController';
import express from 'express';
import { dbApiService } from '../../apiServices';

export class IndigoController extends BaseApiController {

    bootRoutes(): void {
        this.router.get(`${this.basePath}/cdps`, this.cdps);
        this.router.get(`${this.basePath}/staking/positions`, this.stakingPositions);
    }

    private cdps(request: express.Request, response: express.Response) {
        dbApiService.dbSource.query("SELECT * FROM collateralized_debt_positions WHERE consumed is NULL")
            .then((cdps) => {
                response.send(cdps);
            }).catch(() => response.send(super.failResponse('Unable to retrieve CDPs')));
    }

    private stakingPositions(request: express.Request, response: express.Response) {
        dbApiService.dbSource.query("SELECT * FROM staking_positions WHERE consumed is NULL")
            .then((positions) => {
                response.send(positions);
            }).catch(() => response.send(super.failResponse('Unable to retrieve staking positions')));
    }

}
