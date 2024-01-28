import { BaseService } from './BaseService';
import { BroadcastableEvent } from '../types';
import { BaseEventListener } from '../listeners/BaseEventListener';
import { AmmDexOperationListener } from '../listeners/AmmDexOperationListener';
import { PoolStateListener } from '../listeners/PoolStateListener';
import { OrderBookDexOperationListener } from '../listeners/OrderBookDexOperationListener';

export class EventService extends BaseService {

    private _listeners: BaseEventListener[] = [];

    public boot(listeners: BaseEventListener[] = []): Promise<void> {
        this._listeners = [
            ...listeners,
            new AmmDexOperationListener(),
            new OrderBookDexOperationListener(),
            new PoolStateListener(),
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
