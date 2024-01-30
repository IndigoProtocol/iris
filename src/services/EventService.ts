import { BaseService } from './BaseService';
import { BroadcastableEvent } from '../types';
import { BaseEventListener } from '../listeners/BaseEventListener';
import { AmmDexOperationListener } from '../listeners/AmmDexOperationListener';
import { PoolStateListener } from '../listeners/PoolStateListener';
import { OrderBookDexOperationListener } from '../listeners/OrderBookDexOperationListener';
import { IndexerApplication } from '../IndexerApplication';

export class EventService extends BaseService {

    private _listeners: BaseEventListener[] = [];

    public boot(app: IndexerApplication, listeners: BaseEventListener[] = []): Promise<void> {
        this._listeners = [
            ...listeners,
            new AmmDexOperationListener(app),
            new OrderBookDexOperationListener(app),
            new PoolStateListener(app),
        ];

        return Promise.resolve();
    }

    public pushEvent(event: BroadcastableEvent): Promise<any> {
        return Promise.all(
            this._listeners.map((listener: BaseEventListener) => {
                if (listener.listenFor.includes(event.type)) {
                    return listener.onEvent(event)
                }
                return;
            })
        );
    }

}
