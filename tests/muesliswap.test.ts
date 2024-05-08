import { globals } from './setup';
import { MuesliSwapAnalyzer } from '../src/dex/MuesliSwapAnalyzer';
import { HybridOperation } from '../src/types';
import { LiquidityPoolSwap } from '../src/db/entities/LiquidityPoolSwap';
import { LiquidityPoolState } from '../src/db/entities/LiquidityPoolState';
import { BaseHybridDexAnalyzer } from '../src/dex/BaseHybridDexAnalyzer';

describe('MuesliSwap', () => {

    const analyzer: BaseHybridDexAnalyzer = new MuesliSwapAnalyzer(globals.app);

    it('Can index swaps', async () => {
        const operations: HybridOperation[] = await analyzer.analyzeTransaction(globals.MUESLISWAP_SWAP_TX);

        expect(operations.length).toEqual(1);
        expect(operations[0]).toBeInstanceOf(LiquidityPoolSwap);
        expect(operations[0].txHash).toEqual(globals.MUESLISWAP_SWAP_TX.hash);
    });

    it('Can index LP states', async () => {
        const operations: HybridOperation[] = await analyzer.analyzeTransaction(globals.MUESLISWAP_LP_STATE_TX);

        expect(operations.length).toEqual(1);
        expect(operations[0]).toBeInstanceOf(LiquidityPoolState);
        expect(operations[0].txHash).toEqual(globals.MUESLISWAP_LP_STATE_TX.hash);
    });

    it('Can filter non-related transactions', async () => {
        const operations: HybridOperation[] = await analyzer.analyzeTransaction(globals.MINSWAP_SWAP_TX);

        expect(operations.length).toEqual(0);
    });

});