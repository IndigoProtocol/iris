import { globals } from './setup';
import { BaseAmmDexAnalyzer } from '../src/dex/BaseAmmDexAnalyzer';
import { SundaeSwapAnalyzer } from '../src/dex/SundaeSwapAnalyzer';
import { LiquidityPool } from '../src/db/entities/LiquidityPool';
import { Dex } from '../src/constants';
import { Asset } from '../src/db/entities/Asset';
import { AmmDexOperation } from '../src/types';
import { LiquidityPoolSwap } from '../src/db/entities/LiquidityPoolSwap';
import { LiquidityPoolDeposit } from '../src/db/entities/LiquidityPoolDeposit';
import { LiquidityPoolWithdraw } from '../src/db/entities/LiquidityPoolWithdraw';
import { LiquidityPoolState } from '../src/db/entities/LiquidityPoolState';

describe('SundaeSwap', () => {
  const analyzer: BaseAmmDexAnalyzer = new SundaeSwapAnalyzer(globals.app);

  beforeEach(() => {
    globals.app.cache.setKey(
      '00',
      LiquidityPool.make(
        Dex.SundaeSwap,
        '04',
        '',
        Asset.fromId(
          '7de52b397c138e44fb6e61aaaeb26219a8059b1749b7c3bd87bd9488.524245525259'
        ),
        Asset.fromId(
          '7de52b397c138e44fb6e61aaaeb26219a8059b1749b7c3bd87bd9488.534245525259'
        ),
        1234
      )
    );
  });

  it('Can index swaps', async () => {
    const operations: AmmDexOperation[] = await analyzer.analyzeTransaction(
      globals.SUNDAESWAP_SWAP_TX
    );

    expect(operations.length).toEqual(1);
    expect(operations[0]).toBeInstanceOf(LiquidityPoolSwap);
    expect(operations[0].txHash).toEqual(globals.SUNDAESWAP_SWAP_TX.hash);
  });

  it('Can index deposits', async () => {
    const operations: AmmDexOperation[] = await analyzer.analyzeTransaction(
      globals.SUNDAESWAP_DEPOSIT_TX
    );

    expect(operations.length).toEqual(1);
    expect(operations[0]).toBeInstanceOf(LiquidityPoolDeposit);
    expect(operations[0].txHash).toEqual(globals.SUNDAESWAP_DEPOSIT_TX.hash);
  });

  it('Can index withdraws', async () => {
    const operations: AmmDexOperation[] = await analyzer.analyzeTransaction(
      globals.SUNDAESWAP_WITHDRAW_TX
    );

    expect(operations.length).toEqual(1);
    expect(operations[0]).toBeInstanceOf(LiquidityPoolWithdraw);
    expect(operations[0].txHash).toEqual(globals.SUNDAESWAP_WITHDRAW_TX.hash);
  });

  it('Can index LP states', async () => {
    const operations: AmmDexOperation[] = await analyzer.analyzeTransaction(
      globals.SUNDAESWAP_LP_STATE_TX
    );

    expect(operations.length).toEqual(1);
    expect(operations[0]).toBeInstanceOf(LiquidityPoolState);
    expect(operations[0].txHash).toEqual(globals.SUNDAESWAP_LP_STATE_TX.hash);
  });

  it('Can filter non-related transactions', async () => {
    const operations: AmmDexOperation[] = await analyzer.analyzeTransaction(
      globals.MINSWAP_SWAP_TX
    );

    expect(operations.length).toEqual(0);
  });
});
