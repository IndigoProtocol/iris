import { IndexerEventType } from '../constants';
import { IndexerEvent } from '../types';
import { IndexerApplication } from '../IndexerApplication';

export abstract class BaseEventListener {

    public app: IndexerApplication | undefined;

    public abstract listenFor: IndexerEventType[];

    constructor(app: IndexerApplication | undefined = undefined) {
        this.app = app;
    }

    abstract onEvent(event: IndexerEvent): Promise<any>;

}
