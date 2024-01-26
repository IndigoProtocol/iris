import { IndexerEventType } from '../constants';
import { IndexerEvent } from '../types';

export abstract class BaseEventListener {

    public abstract listenFor: IndexerEventType[];

    abstract onEvent(event: IndexerEvent): Promise<any>;

}
