import { OrderBookDexOperation, Transaction } from '../types';
import { OrderBookOrder } from '../db/entities/OrderBookOrder';
import { OrderBookMatch } from '../db/entities/OrderBookMatch';
import { IndexerApplication } from '../IndexerApplication';

export abstract class BaseOrderBookDexAnalyzer {

    public app: IndexerApplication;

    constructor(app: IndexerApplication) {
        this.app = app;
    }

    public abstract analyzeTransaction(transaction: Transaction): Promise<OrderBookDexOperation[]>;

    protected abstract orders(transaction: Transaction): Promise<OrderBookOrder[]> | OrderBookOrder[];

    protected abstract matches(transaction: Transaction): Promise<(OrderBookMatch | OrderBookOrder)[]> | (OrderBookMatch | OrderBookOrder)[];

}
