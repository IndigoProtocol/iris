import { LiquidityPoolStateResource } from '../api/resources/LiquidityPoolStateResource';
import { IrisEventType } from '../constants';
import { IrisEvent } from '../events.types';
import { BaseEventListener } from './BaseEventListener';

export class PoolStateListener extends BaseEventListener {
  public listenFor: IrisEventType[] = [
    IrisEventType.LiquidityPoolCreated,
    IrisEventType.LiquidityPoolUpdated,
    IrisEventType.LiquidityPoolStateCreated,
    IrisEventType.LiquidityPoolStateUpdated,
  ];

  public onEvent(event: IrisEvent): Promise<any> {
    if (!this.app) return Promise.resolve();
    let storageKey: string;
    switch (event.type) {
      // case IrisEventType.LiquidityPoolCreated:
      // case IrisEventType.LiquidityPoolUpdated:
      case IrisEventType.LiquidityPoolStateCreated:
      case IrisEventType.LiquidityPoolStateUpdated:
        storageKey = `cardano:pstate:${event.data.liquidityPoolIdentifier}`;

        return this.app.cache.setKey(
          storageKey,
          new LiquidityPoolStateResource(false).toJsonRedis(event.data)
        );
      default:
        return Promise.resolve();
    }
  }
}
