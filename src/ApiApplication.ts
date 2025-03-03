import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import CONFIG from './config';
import { logError, logInfo } from './logger';
import { BaseApiController } from './api/controllers/BaseApiController';
import { AssetController } from './api/controllers/AssetController';
import { BaseService } from './services/BaseService';
import { dbApiService } from './apiServices';
import { LiquidityPoolController } from './api/controllers/LiquidityPoolController';
import { SyncController } from './api/controllers/SyncController';
import { DexController } from './api/controllers/DexController';
import { ApplicationContext } from './constants';
import { OrdersController } from './api/controllers/OrdersController';
import { PingController } from './api/controllers/PingController';
import { OrderBookController } from './api/controllers/OrderBookController';

export class ApiApplication {
  private _express: Application;
  private readonly _controllers: BaseApiController[];

  /**
   * ApiApplication constructor.
   */
  constructor(controllers: BaseApiController[] = []) {
    this._controllers = controllers;
    this._express = express();

    this._express.use(cors());
    this._express.use(express.json());
    this._express.use(helmet());
  }

  /**
   * Start application.
   */
  public async start(): Promise<any> {
    this.bootControllers();

    return Promise.all([
      this.bootServices(),
      this._express.listen(CONFIG.API_PORT),
    ]).then(() => {
      logInfo(
        `ApiApplication started on port ${CONFIG.API_PORT}`,
        ApplicationContext.Api
      );
    });
  }

  /**
   * Boot all API controllers.
   */
  private bootControllers(): void {
    const controllers: BaseApiController[] = [
      ...this._controllers,
      new PingController('/ping'),
      new SyncController('/sync'),
      new AssetController('/assets'),
      new LiquidityPoolController('/liquidity-pools'),
      new OrderBookController('/order-books'),
      new DexController('/dex'),
      new OrdersController('/orders'),
    ];

    controllers.forEach((controller: BaseApiController) => {
      controller.bootRoutes();

      this._express.use('/api', controller.router);
    });
  }

  /**
   * Boot all necessary services for application.
   */
  private bootServices(): Promise<any> {
    logInfo('Booting services...');

    const services: BaseService[] = [dbApiService];

    return Promise.all(
      services.map((service: BaseService) => service.boot(this))
    )
      .then(() => {
        logInfo('Services booted');
      })
      .catch((reason) => {
        logError(reason);
        process.exit(0);
      });
  }
}
