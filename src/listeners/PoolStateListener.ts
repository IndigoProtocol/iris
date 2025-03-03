import { LiquidityPoolStateResource } from "../api/resources/LiquidityPoolStateResource";
import { IrisEventType } from "../constants";
import { IrisEvent } from "../events.types";
import { BaseEventListener } from "./BaseEventListener";

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
      case IrisEventType.LiquidityPoolCreated:
      case IrisEventType.LiquidityPoolUpdated:
        storageKey = `plist:${event.data.id}`;

        return this.app.cache.setKey(storageKey, event.data);
      case IrisEventType.LiquidityPoolStateCreated:
      case IrisEventType.LiquidityPoolStateUpdated:
        storageKey = `pstate:${event.data.liquidityPoolIdentifier}`;

        return this.app.cache.setKey(
          storageKey,
          new LiquidityPoolStateResource(false).toJson(event.data),
        );
      default:
        return Promise.resolve();
    }
  }
}
