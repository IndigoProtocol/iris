import { IndexerApplication } from '../IndexerApplication';
import { IrisEvent } from '../events.types';
import { IrisEventType } from '../constants';

export abstract class BaseEventListener {

    public app: IndexerApplication | undefined;

    public abstract listenFor: IrisEventType[];

    constructor(app: IndexerApplication | undefined = undefined) {
        this.app = app;
    }

    abstract onEvent(event: IrisEvent): Promise<any>;

}
