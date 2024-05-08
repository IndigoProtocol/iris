import { globals } from './setup';
import { BaseAmmDexAnalyzer } from '../src/dex/BaseAmmDexAnalyzer';
import { AmmDexOperation } from '../src/types';
import { LiquidityPoolSwap } from '../src/db/entities/LiquidityPoolSwap';
import { LiquidityPoolDeposit } from '../src/db/entities/LiquidityPoolDeposit';
import { LiquidityPoolWithdraw } from '../src/db/entities/LiquidityPoolWithdraw';
import { LiquidityPoolState } from '../src/db/entities/LiquidityPoolState';
import { SpectrumAnalyzer } from '../src/dex/SpectrumAnalyzer';

describe('Spectrum', () => {

    const analyzer: BaseAmmDexAnalyzer = new SpectrumAnalyzer(globals.app);

    it('Can index swaps', async () => {
        const operations: AmmDexOperation[] = await analyzer.analyzeTransaction(globals.SPECTRUM_SWAP_TX);

        expect(operations.length).toEqual(1);
        expect(operations[0]).toBeInstanceOf(LiquidityPoolSwap);
        expect(operations[0].txHash).toEqual(globals.SPECTRUM_SWAP_TX.hash);
    });

    it('Can index deposits', async () => {
        const operations: AmmDexOperation[] = await analyzer.analyzeTransaction(globals.SPECTRUM_DEPOSIT_TX);

        expect(operations.length).toEqual(1);
        expect(operations[0]).toBeInstanceOf(LiquidityPoolDeposit);
        expect(operations[0].txHash).toEqual(globals.SPECTRUM_DEPOSIT_TX.hash);
    });

    it('Can index withdraws', async () => {
        const operations: AmmDexOperation[] = await analyzer.analyzeTransaction(globals.SPECTRUM_WITHDRAW_TX);

        expect(operations.length).toEqual(1);
        expect(operations[0]).toBeInstanceOf(LiquidityPoolWithdraw);
        expect(operations[0].txHash).toEqual(globals.SPECTRUM_WITHDRAW_TX.hash);
    });

    it('Can index LP states', async () => {
        const operations: AmmDexOperation[] = await analyzer.analyzeTransaction(globals.SPECTRUM_LP_STATE_TX);

        expect(operations.length).toEqual(1);
        expect(operations[0]).toBeInstanceOf(LiquidityPoolState);
        expect(operations[0].txHash).toEqual(globals.SPECTRUM_LP_STATE_TX.hash);
    });

    it('Can filter non-related transactions', async () => {
        const operations: AmmDexOperation[] = await analyzer.analyzeTransaction(globals.SUNDAESWAP_SWAP_TX);

        expect(operations.length).toEqual(0);
    });

});