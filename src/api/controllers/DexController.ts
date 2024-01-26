import { BaseApiController } from './BaseApiController';
import express from 'express';
import metadata from '../../dex/metadata.json' assert { type: "json" };

export class DexController extends BaseApiController {

    bootRoutes(): void {
        this.router.get(`${this.basePath}/metadata`, this.metadata);
    }

    private metadata(request: express.Request, response: express.Response) {
        response.send(metadata);
    }

}
