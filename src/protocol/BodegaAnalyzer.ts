import {
    ProtocolOperation,
    Transaction,
    Utxo,
} from '../types';
import { BaseProtocolAnalyzer } from './BaseProtocolAnalyzer';

export class BodegaAnalyzer extends BaseProtocolAnalyzer {

    public startSlot: number = 109078697;

    /**
     * Analyze transaction for possible DEX operations.
     */
    public async analyzeTransaction(transaction: Transaction): Promise<ProtocolOperation[]> {
        return Promise.all([
            // todo
        ]).then((operations: ProtocolOperation[][]) => operations.flat(2));
    }

}
