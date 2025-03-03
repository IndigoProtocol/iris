import { BaseService } from './BaseService';
import { BaseEventListener } from '../listeners/BaseEventListener';
import { PoolStateListener } from '../listeners/PoolStateListener';
import { IndexerApplication } from '../IndexerApplication';
import { IrisEvent } from '../events.types';

export class EventService extends BaseService {
  private _listeners: BaseEventListener[] = [];

  public boot(
    app: IndexerApplication,
    listeners: BaseEventListener[] = []
  ): Promise<void> {
    this._listeners = [...listeners, new PoolStateListener(app)];

    return Promise.resolve();
  }

  public pushEvent(event: IrisEvent): Promise<any> {
    return Promise.all(
      this._listeners.map((listener: BaseEventListener) => {
        if (listener.listenFor.includes(event.type as any)) {
          return listener.onEvent(event);
        }
        return;
      })
    );
  }
}
