import { BaseApiController } from './BaseApiController';
import express from 'express';
import { dbApiService } from '../../apiServices';

export class LiqwidController extends BaseApiController {

    bootRoutes(): void {
        this.router.get(`${this.basePath}/markets/parameters`, this.parameters);
    }

    private parameters(request: express.Request, response: express.Response) {
        dbApiService.dbSource.query(`
        SELECT lm.*
        FROM liqwid_markets lm
        JOIN (
          SELECT asset, MAX(slot) AS max_slot
          FROM liqwid_markets
          GROUP BY asset
        ) latest
          ON lm.asset = latest.asset
         AND lm.slot = latest.max_slot;
        `)
            .then((cdps) => {
                response.send(cdps);
            }).catch(() => response.send(super.failResponse('Unable to retrieve markets')));
    }

}
