import { BaseEventListener } from './BaseEventListener';
import { IrisEventType } from '../constants';
import { IrisEvent } from '../events.types';

export class PoolStateListener extends BaseEventListener {

    public listenFor: IrisEventType[] = [
        IrisEventType.LiquidityPoolCreated,
    ];

    public onEvent(event: IrisEvent): Promise<any> {
        if (! this.app) return Promise.resolve();

        switch (event.type) {
            case IrisEventType.LiquidityPoolCreated:
                const storageKey: string = event.data.identifier;

                return this.app.cache.setKey(storageKey, event.data);
            default:
                return Promise.resolve();
        }
    }

}
