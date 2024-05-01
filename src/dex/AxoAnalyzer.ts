import { BaseOrderBookDexAnalyzer } from './BaseOrderBookDexAnalyzer';
import {
    AssetBalance,
    OrderBookDexOperation,
    OrderBookOrderCancellation,
    Transaction,
} from '../types';
import { OrderBookOrder } from '../db/entities/OrderBookOrder';
import { OrderBookMatch } from '../db/entities/OrderBookMatch';

/**
 * Axo constants.
 */
const METADATA_LABEL: string = '721';
const METADATA_PRICE_HEX: string = '7072696365';
const METADATA_START_DATE_HEX: string = '737461727444617465';
const METADATA_END_DATE_HEX: string = '656e6444617465';

export class AxoAnalyzer extends BaseOrderBookDexAnalyzer {

    public startSlot: number = 110315300;

    public async analyzeTransaction(transaction: Transaction): Promise<OrderBookDexOperation[]> {
        return Promise.all([
            this.orders(transaction),
            this.matches(transaction),
            this.cancellations(transaction),
        ]).then((operations: OrderBookDexOperation[][]) => operations.flat());
    }

    protected orders(transaction: Transaction): Promise<OrderBookOrder[]> | OrderBookOrder[] {
        if (! transaction.metadata || ! transaction.metadata[METADATA_LABEL]) {
            return [];
        }

        const metadata = transaction.metadata[METADATA_LABEL];
        const tokenPolicyId: string | undefined = Object.keys(metadata)[0];

        if (! tokenPolicyId) return [];

        const orderTokenBalance: AssetBalance | undefined = transaction.outputs[0].assetBalances
            .find((balance: AssetBalance) => balance.asset.policyId === tokenPolicyId && balance.quantity === 1n);
        const tokenSentToUser: boolean = transaction.outputs.length > 1 && transaction.outputs[1].assetBalances
            .some((balance: AssetBalance) => balance.asset.policyId === tokenPolicyId && balance.quantity === 1n)

        if (! orderTokenBalance || ! tokenSentToUser) return [];

        // return transaction.outputs.map((output: Utxo) => {
        //     if (! output.datum || ! transaction.metadata) {
        //         return undefined;
        //     }
        //
        //     return [];
        // })
            // .flat().filter((order: OrderBookOrder | undefined) => order !== undefined) as (OrderBookOrder)[];


        return Promise.resolve([]);
    }

    protected matches(transaction: Transaction): Promise<(OrderBookMatch | OrderBookOrder)[]> | (OrderBookMatch | OrderBookOrder)[] {
        return Promise.resolve([]);
    }

    protected cancellations(transaction: Transaction): Promise<OrderBookOrderCancellation[]> | OrderBookOrderCancellation[] {
        return Promise.resolve([]);
    }

}
