import { Asset } from '../src/db/entities/Asset';
import { LiquidityPoolState } from '../src/db/entities/LiquidityPoolState';
import { BaseAmmDexAnalyzer } from '../src/dex/BaseAmmDexAnalyzer';
import { MinswapStableAnalyzer } from '../src/dex/MinswapStableAnalyzer';
import { Utxo } from '../src/types';
import { ASSETS } from './fixtures';
import { globals } from './setup';

describe('Minswap', () => {
  const analyzer: BaseAmmDexAnalyzer = new MinswapStableAnalyzer(globals.app);

  it('Can index USDC-iUSD pool', async () => {
    const txn = {
      hash: 'fe0dbbced37a4a0d19a22a14504441bbbd8a6de46590822b6cf6fddb1cebea2c',
      blockHash:
        '0244af51d6385c114b24bb97b3aafe5e094fb05b072d422f56ba68fef781d8e6',
      blockSlot: 153729615,
      inputs: [],
      outputs: [
        {
          forTxHash:
            'fe0dbbced37a4a0d19a22a14504441bbbd8a6de46590822b6cf6fddb1cebea2c',
          toAddress:
            'addr1wytm0yuffszdzkme56mlm07htw388vkny2wy49ch7c3p57s4wwk57',
          datum:
            'd8799f9f1b0000003c36989ca81a79b46194ff1b0000006baecdc8390a581cf5da441786eef04048a9f59fff53c5c9ef101a59ad0488e1a8aa3897ff',
          index: 0,
          lovelaceBalance: 1724000n,
          assetBalances: [
            {
              asset: ASSETS.USDC,
              quantity: 258616528493n,
            },
            {
              asset: Asset.fromId(
                '3ff28ad0d4788f24619746cc86b774495ed4727634b61710d2bb7ed5.555344432d695553442d534c50'
              ),
              quantity: 1n,
            },
            {
              asset: ASSETS.iUSD,
              quantity: 2041947441n,
            },
          ],
        } as Utxo,
      ],
      fee: 0n,
      mints: [],
      datums: {},
      redeemers: [],
    };

    const operations = await analyzer.analyzeTransaction(txn);

    expect(operations.length).toEqual(1);
    const [pool] = operations as [LiquidityPoolState];
    expect(pool).toBeInstanceOf(LiquidityPoolState);
    expect(pool.txHash).toEqual(txn.hash);
    expect(pool.extra.amp).toEqual(10);
    expect(pool.extra.feeNumerator).toEqual(1);
    expect(pool.extra.feeDenominator).toEqual(10000);
    expect(pool.extra.multipliers).toEqual([1, 100]);
    expect(pool.extra.balances).toEqual(['279238336896', '1841864598']);
    expect(pool.reserveA).toEqual('258616528493');
    expect(pool.reserveB).toEqual('2041947441');
  });

  it.todo('Can filter non-related transactions');
});
