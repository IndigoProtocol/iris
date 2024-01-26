export abstract class BaseJob {

    public uuid: number;

    protected constructor() {
        this.uuid = Math.random();
    }

    abstract handle(): Promise<any>;

}
