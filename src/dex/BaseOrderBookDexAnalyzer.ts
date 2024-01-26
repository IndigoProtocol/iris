import { OrderBookDexOperation, Transaction } from '../types';
import { OrderBookOrder } from '../db/entities/OrderBookOrder';
import { OrderBookMatch } from '../db/entities/OrderBookMatch';

export abstract class BaseOrderBookDexAnalyzer {

    public abstract analyzeTransaction(transaction: Transaction): Promise<OrderBookDexOperation[]>;

    protected abstract orders(transaction: Transaction): Promise<OrderBookOrder[]> | OrderBookOrder[];

    protected abstract matches(transaction: Transaction): Promise<(OrderBookMatch | OrderBookOrder)[]> | (OrderBookMatch | OrderBookOrder)[];

}
