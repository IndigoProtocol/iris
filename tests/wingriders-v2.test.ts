import { Asset } from '../src/db/entities/Asset';
import { LiquidityPoolState } from '../src/db/entities/LiquidityPoolState';
import { BaseAmmDexAnalyzer } from '../src/dex/BaseAmmDexAnalyzer';
import { WingRidersV2Analyzer } from '../src/dex/WingRidersV2Analyzer';
import { AmmDexOperation, Utxo } from '../src/types';
import { globals } from './setup';

describe('Wingriders V2', () => {
  const analyzer: BaseAmmDexAnalyzer = new WingRidersV2Analyzer(globals.app);

  it('Can index AMM pools', async () => {
    const operations: AmmDexOperation[] = await analyzer.analyzeTransaction({
      hash: '2920a6129cfb3b755e9e3ed7d36d7864c6f6f71b6aeba657322f64a808966aed',
      blockHash:
        '0244af51d6385c114b24bb97b3aafe5e094fb05b072d422f56ba68fef781d8e6',
      blockSlot: 153729615,
      inputs: [],
      outputs: [
        {
          forTxHash:
            '2920a6129cfb3b755e9e3ed7d36d7864c6f6f71b6aeba657322f64a808966aed',
          toAddress:
            'addr1zxhew7fmsup08qvhdnkg8ccra88pw7q5trrncja3dlszhqlm3e807762pklheldndtjhrk0qxzzfh9vhc9kkc706xglsv8s5nq',
          datum:
            'd8799f581cc134d839a64a5dfb9b155869ef3f34280751a622f69958baa8ffd29c4040581cc48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad480014df105553444d140500001927101a001e84801b00000196e6dfbde81a0319a19c1a02188b2a00000000d87a80d87a80d87980ff',
          index: 0,
          lovelaceBalance: 312769830006n,
          assetBalances: [
            {
              asset: Asset.fromId(
                '6fdc63a1d71dc2c65502b79baae7fb543185702b12c3c5fb639ed737.4c'
              ),
              quantity: 1n,
            },
            {
              asset: Asset.fromId(
                '6fdc63a1d71dc2c65502b79baae7fb543185702b12c3c5fb639ed737.93237c26780971289912e3fc907bd7b2cc1ca33ff248616e13299a1219be3ed0'
              ),
              quantity: 9223371796191037094n,
            },
            {
              asset: Asset.fromId(
                'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad.0014df105553444d'
              ),
              quantity: 228779006327n,
            },
          ],
        } as Utxo,
      ],
      fee: 0n,
      mints: [],
      datums: {},
      redeemers: [],
    });

    expect(operations.length).toEqual(1);
    expect(operations[0]).toBeInstanceOf(LiquidityPoolState);
    expect(operations[0].txHash).toEqual(
      '2920a6129cfb3b755e9e3ed7d36d7864c6f6f71b6aeba657322f64a808966aed'
    );
  });

  it('Can filter stable pools', async () => {
    const operations: AmmDexOperation[] = await analyzer.analyzeTransaction({
      hash: '7fecad4f21ee2ce92d05737bf559700d809cb66e79d4548c68396a9b5726720e',
      blockHash:
        '0244af51d6385c114b24bb97b3aafe5e094fb05b072d422f56ba68fef781d8e6',
      blockSlot: 153729615,
      inputs: [],
      outputs: [
        {
          forTxHash:
            '7fecad4f21ee2ce92d05737bf559700d809cb66e79d4548c68396a9b5726720e',
          toAddress:
            'addr1wx2x4c3ggv8jl3j24ze6ewgsacn7nvly0250jf06cfurfggd7zqtl',
          datum:
            'd8799f581c23680ea6701b56f2c12ae79d8af94fd36f509b7b007029c7ce114840581c8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd614c446a65644d6963726f555344581cc48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad480014df105553444d050100001927101a001e84801b00000196e51cebc01a00934f8a1a0094f56c00000000d87a80d87a80d8799f1afd7259c10101ffff',
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
              quantity: 9223372034768554909n,
            },
            {
              asset: Asset.fromId(
                '8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd61.446a65644d6963726f555344'
              ),
              quantity: 2811789321n,
            },
            {
              asset: Asset.fromId(
                'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad.0014df105553444d'
              ),
              quantity: 1461334044n,
            },
          ],
        } as Utxo,
      ],
      fee: 0n,
      mints: [],
      datums: {},
      redeemers: [],
    });

    expect(operations.length).toEqual(0);
  });
});
