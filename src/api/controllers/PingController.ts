import { BaseApiController } from './BaseApiController';
import express from 'express';

export class PingController extends BaseApiController {

    bootRoutes(): void {
        this.router.get(`${this.basePath}`, this.ping);
    }

    private ping(request: express.Request, response: express.Response) {
        response.send({
            success: true,
        });
    }

}
