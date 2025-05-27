import { WingRidersStableAnalyzer } from './../src/dex/WingRidersStableAnalyzer';
import { globals } from './setup';
import { BaseAmmDexAnalyzer } from '../src/dex/BaseAmmDexAnalyzer';
import { WingRidersAnalyzer } from '../src/dex/WingRidersAnalyzer';
import { AmmDexOperation, Utxo } from '../src/types';
import { LiquidityPoolSwap } from '../src/db/entities/LiquidityPoolSwap';
import { LiquidityPoolDeposit } from '../src/db/entities/LiquidityPoolDeposit';
import { LiquidityPoolWithdraw } from '../src/db/entities/LiquidityPoolWithdraw';
import { LiquidityPoolState } from '../src/db/entities/LiquidityPoolState';
import { Asset } from '../src/db/entities/Asset';
import { ASSETS } from './fixtures';
import exp from 'constants';

describe('Wingriders Stable', () => {
  const analyzer: BaseAmmDexAnalyzer = new WingRidersStableAnalyzer(
    globals.app
  );

  // https://cardanoscan.io/transaction/a8b780e1d394b96c9eb0c256604ceaef4618acdd1b6f0125ea84aa27145e483c
  it('Can index USDM - USDA pool', async () => {
    const txn = {
      hash: 'a8b780e1d394b96c9eb0c256604ceaef4618acdd1b6f0125ea84aa27145e483c',
      blockHash:
        '32f94deddc9bcac740a0cffe5ed6653ed3329b2f924e3798ecfcde3abd3004cb',
      blockSlot: 156554223,
      inputs: [],
      outputs: [
        {
          forTxHash:
            'a8b780e1d394b96c9eb0c256604ceaef4618acdd1b6f0125ea84aa27145e483c',
          toAddress:
            'addr1wx2x4c3ggv8jl3j24ze6ewgsacn7nvly0250jf06cfurfggd7zqtl',
          datum:
            'd8799f581c23680ea6701b56f2c12ae79d8af94fd36f509b7b007029c7ce114840581cc48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad480014df105553444d581cfe7c786ab321f41c654ef6c1af7b3250a613c24e4213e0425a7ae4564455534441050100001927101a001e84801b0000019700c01dc01a000257691a0002b07900000000d87a80d87a80d8799f1a8412b14a0101ffff',
          index: 0,
          lovelaceBalance: 3_000_000n,
          assetBalances: [
            {
              asset: ASSETS.USDM,
              quantity: 1_196_355383n,
            },
            {
              asset: Asset.fromId(
                '6fdc63a1d71dc2c65502b79baae7fb543185702b12c3c5fb639ed737.4c'
              ),
              quantity: 1n,
            },
            {
              asset: Asset.fromId(
                '6fdc63a1d71dc2c65502b79baae7fb543185702b12c3c5fb639ed737.4e4ab60fb2b6b04feb5dac07575599209993ae3656696a80b21393c89ee62a87'
              ),
              quantity: 9_223_372_035_747_635_825n,
            },
            {
              asset: ASSETS.USDA,
              quantity: 1_019_838_729n,
            },
          ],
        } as Utxo,
      ],
      fee: 0n,
      mints: [],
      datums: {},
      redeemers: [],
    };
    const operations: AmmDexOperation[] =
      await analyzer.analyzeTransaction(txn);

    expect(operations.length).toEqual(1);
    const [pool] = operations as [LiquidityPoolState];
    expect(pool).toBeInstanceOf(LiquidityPoolState);
    expect(pool.txHash).toEqual(txn.hash);
    expect(pool.extra.Multiplier0).toEqual(1);
    expect(pool.extra.Multiplier1).toEqual(1);
    expect(pool.extra.InvariantD).toEqual(2_215_817_546);
    expect(pool.extra.feeNumerator).toEqual(6);
    expect(pool.extra.feeDenominator).toEqual(10_000);
    expect(pool.reserveA).toEqual(String(1196355383 - 153449));
    expect(pool.reserveB).toEqual(String(1019838729 - 176249));

    expect(pool.tokenA?.identifier()).toEqual(ASSETS.USDM.identifier());
    expect(pool.tokenB?.identifier()).toEqual(ASSETS.USDA.identifier());
  });

  // https://cardanoscan.io/transaction/ef501c68c43e9983628afda891df5749b1943a97d501faf11151f5b47dc4cb37
  it('Can index USDM - DJED pool', async () => {
    const txn = {}


  });
});
