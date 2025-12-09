import { BaseApiController } from './BaseApiController';
import express from 'express';

export class BodegaController extends BaseApiController {

    bootRoutes(): void {
        this.router.get(`${this.basePath}`, this.metadata);
    }

    private metadata(request: express.Request, response: express.Response) {
        response.send({});
    }

}
