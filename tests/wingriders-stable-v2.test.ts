import { WingRidersStableV2Analyzer } from '../src/dex/WingRidersStableV2Analyzer';
import { globals } from './setup';
import { BaseAmmDexAnalyzer } from '../src/dex/BaseAmmDexAnalyzer';
import { AmmDexOperation, Utxo } from '../src/types';
import { LiquidityPoolState } from '../src/db/entities/LiquidityPoolState';
import { Asset } from '../src/db/entities/Asset';
import { ASSETS } from './fixtures';

describe('Wingriders Stable V2', () => {
  const analyzer: BaseAmmDexAnalyzer = new WingRidersStableV2Analyzer(
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
    expect(pool.feePercent).toEqual(0.06);
    expect(pool.extra.feeNumerator).toEqual(6);
    expect(pool.extra.feeDenominator).toEqual(10_000);
    // Extra data for Wingriders Stable pools
    expect(pool.extra.Multiplier0).toEqual('1');
    expect(pool.extra.Multiplier1).toEqual('1');
    expect(pool.extra.InvariantD).toEqual(String(2_215_817_546));
    expect(pool.extra.SwapFeeInBasis).toEqual(5);
    expect(pool.extra.OtherFeeInBasis).toEqual(1);
    expect(pool.reserveA).toEqual(String(1_196_355_383 - 153_449));
    expect(pool.reserveB).toEqual(String(1_019_838_729 - 176_249));
    // Extra balances same as reserves
    expect(pool.extra.Balance0).toEqual(String(1_196_355_383 - 153_449));
    expect(pool.extra.Balance1).toEqual(String(1_019_838_729 - 176_249));

    expect(pool.tokenA?.identifier()).toEqual(ASSETS.USDM.identifier());
    expect(pool.tokenB?.identifier()).toEqual(ASSETS.USDA.identifier());
  });

  // https://cardanoscan.io/transaction/ef501c68c43e9983628afda891df5749b1943a97d501faf11151f5b47dc4cb37
  it('Can index DJED - USDM pool', async () => {
    const txn = {
      hash: 'ef501c68c43e9983628afda891df5749b1943a97d501faf11151f5b47dc4cb37',
      blockHash:
        '32f94deddc9bcac740a0cffe5ed6653ed3329b2f924e3798ecfcde3abd3004cb',
      blockSlot: 156554223,
      inputs: [],
      outputs: [
        {
          forTxHash:
            'ef501c68c43e9983628afda891df5749b1943a97d501faf11151f5b47dc4cb37',
          toAddress:
            'addr1wx2x4c3ggv8jl3j24ze6ewgsacn7nvly0250jf06cfurfggd7zqtl',
          datum:
            'd8799f581c23680ea6701b56f2c12ae79d8af94fd36f509b7b007029c7ce114840581c8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd614c446a65644d6963726f555344581cc48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad480014df105553444d050100001927101a001e84801b000001970427ca301a00989fcf1a009b950600000000d87a80d87a80d8799f1afdadf5300101ffff',
          index: 0,
          lovelaceBalance: 3_000_000n,
          assetBalances: [
            {
              asset: Asset.fromId(
                '6fdc63a1d71dc2c65502b79baae7fb543185702b12c3c5fb639ed737.4c'
              ),
              quantity: 1n,
            },
            {
              asset: Asset.fromId(
                '6fdc63a1d71dc2c65502b79baae7fb543185702b12c3c5fb639ed737.79b51a3f6fa617c434ede13c29e74831ea15e193c8d0a07a95030c374f7c8611'
              ),
              quantity: 9_223_372_034_768_554_909n,
            },
            {
              asset: ASSETS.DJED,
              quantity: 1_944_193_234n,
            },
            {
              asset: ASSETS.USDM,
              quantity: 2_332_159_478n,
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
    expect(pool.feePercent).toEqual(0.06);
    expect(pool.extra.feeNumerator).toEqual(6);
    expect(pool.extra.feeDenominator).toEqual(10_000);
    // Extra data for Wingriders Stable pools
    expect(pool.extra.Multiplier0).toEqual('1');
    expect(pool.extra.Multiplier1).toEqual('1');
    expect(pool.extra.InvariantD).toEqual(String(4_256_036_144));
    expect(pool.extra.SwapFeeInBasis).toEqual(5);
    expect(pool.extra.OtherFeeInBasis).toEqual(1);
    expect(pool.reserveA).toEqual(String(1_944_193_234 - 10_002_383));
    expect(pool.reserveB).toEqual(String(2_332_159_478 - 10_196_230));
    // Extra balances same as reserves
    expect(pool.extra.Balance0).toEqual(String(1_944_193_234 - 10_002_383));
    expect(pool.extra.Balance1).toEqual(String(2_332_159_478 - 10_196_230));

    expect(pool.tokenA?.identifier()).toEqual(ASSETS.DJED.identifier());
    expect(pool.tokenB?.identifier()).toEqual(ASSETS.USDM.identifier());
  });
});
