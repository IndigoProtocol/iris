import { Dex } from '../src/constants';
import { Asset } from '../src/db/entities/Asset';
import { LiquidityPoolDeposit } from '../src/db/entities/LiquidityPoolDeposit';
import { LiquidityPoolState } from '../src/db/entities/LiquidityPoolState';
import { LiquidityPoolSwap } from '../src/db/entities/LiquidityPoolSwap';
import { LiquidityPoolWithdraw } from '../src/db/entities/LiquidityPoolWithdraw';
import { BaseAmmDexAnalyzer } from '../src/dex/BaseAmmDexAnalyzer';
import { SpectrumAnalyzer } from '../src/dex/SpectrumAnalyzer';
import { AmmDexOperation, Utxo } from '../src/types';
import { globals } from './setup';

describe('Spectrum', () => {
  const analyzer: BaseAmmDexAnalyzer = new SpectrumAnalyzer(globals.app);

  it('Can index swaps', async () => {
    const operations: AmmDexOperation[] = await analyzer.analyzeTransaction(
      globals.SPECTRUM_SWAP_TX
    );

    expect(operations.length).toEqual(1);
    expect(operations[0]).toBeInstanceOf(LiquidityPoolSwap);
    expect(operations[0].txHash).toEqual(globals.SPECTRUM_SWAP_TX.hash);
  });

  it('Can index deposits', async () => {
    const operations: AmmDexOperation[] = await analyzer.analyzeTransaction(
      globals.SPECTRUM_DEPOSIT_TX
    );

    expect(operations.length).toEqual(1);
    expect(operations[0]).toBeInstanceOf(LiquidityPoolDeposit);
    expect(operations[0].txHash).toEqual(globals.SPECTRUM_DEPOSIT_TX.hash);
  });

  it('Can index withdraws', async () => {
    const operations: AmmDexOperation[] = await analyzer.analyzeTransaction(
      globals.SPECTRUM_WITHDRAW_TX
    );

    expect(operations.length).toEqual(1);
    expect(operations[0]).toBeInstanceOf(LiquidityPoolWithdraw);
    expect(operations[0].txHash).toEqual(globals.SPECTRUM_WITHDRAW_TX.hash);
  });

  it('Can index LP states', async () => {
    const operations: AmmDexOperation[] = await analyzer.analyzeTransaction(
      globals.SPECTRUM_LP_STATE_TX
    );

    expect(operations.length).toEqual(1);
    expect(operations[0]).toBeInstanceOf(LiquidityPoolState);
    expect(operations[0].txHash).toEqual(globals.SPECTRUM_LP_STATE_TX.hash);
  });

  it('Can filter non-related transactions', async () => {
    const operations: AmmDexOperation[] = await analyzer.analyzeTransaction(
      globals.SUNDAESWAP_SWAP_TX
    );

    expect(operations.length).toEqual(0);
  });

  it.skip('Can index cfmm v1 pools', async () => {
    const expected = {
      poolType: 'cfmm',
      id: '72f2990e8f906b589926b4290dd511bc846f0ac727c26fd7542f9db2.574d545f4144415f4e4654',
      x: {
        asset: '.',
        amount: '185910601',
      },
      y: {
        asset:
          '1d7f33bd23d85e1a25d87d86fac4f199c3197a2f7afeb662a0f34e1e.776f726c646d6f62696c65746f6b656e',
        amount: '278623086',
      },
      lq: {
        asset:
          '51d9d73a98e20c3a2eb8376927ad001d8a7ddc619c093eadb34dd8e3.574d545f4144415f4c51',
        amount: '9223372036633676857',
      },
      outputId: {
        transactionId:
          'a7dcd1ab4e0fb9ebfd0a391d181a0ecc6d15e55186f854b02d06a01027ae6545',
        transactionIndex: 0,
      },
      poolFeeNumX: 997,
      poolFeeNumY: 997,
      treasuryFee: 0,
      treasuryX: 0,
      treasuryY: 0,
      royaltyFee: null,
      royaltyX: null,
      royaltyY: null,
      royaltyNonce: null,
      royaltyPk: null,
      royaltyUserAddress: null,
      verified: true,
      poolLqBound: 20000000000,
      version: 'v1',
      timestamp: 1733507529,
      blockHeight: 11186051,
    };

    const operations: AmmDexOperation[] = await analyzer.analyzeTransaction(
      (globals.SPLASH_LP_STATE_ROYALTY_POOL_TX = {
        hash: 'a7dcd1ab4e0fb9ebfd0a391d181a0ecc6d15e55186f854b02d06a01027ae6545',
        blockHash:
          '0244af51d6385c114b24bb97b3aafe5e094fb05b072d422f56ba68fef781d8e6',
        blockSlot: 153729615,
        inputs: [],
        outputs: [
          {
            forTxHash:
              'a7dcd1ab4e0fb9ebfd0a391d181a0ecc6d15e55186f854b02d06a01027ae6545',
            toAddress:
              'addr1x8nz307k3sr60gu0e47cmajssy4fmld7u493a4xztjrll0aj764lvrxdayh2ux30fl0ktuh27csgmpevdu89jlxppvrswgxsta',
            datum:
              'd8799fd8799f581c72f2990e8f906b589926b4290dd511bc846f0ac727c26fd7542f9db24b574d545f4144415f4e4654ffd8799f4040ffd8799f581c1d7f33bd23d85e1a25d87d86fac4f199c3197a2f7afeb662a0f34e1e50776f726c646d6f62696c65746f6b656effd8799f581c51d9d73a98e20c3a2eb8376927ad001d8a7ddc619c093eadb34dd8e34a574d545f4144415f4c51ff1903e59f581c3e3afe029dd3d5f86f72b36783022b6fed51c5e5dce5edf3414380e1ff1b00000004a817c800ff',
            index: 0,
            lovelaceBalance: 185910601n,
            assetBalances: [
              {
                asset: Asset.fromId(
                  '51d9d73a98e20c3a2eb8376927ad001d8a7ddc619c093eadb34dd8e3.574d545f4144415f4c51'
                ),
                quantity: 9223372036633676857n,
              },
              {
                asset: Asset.fromId(
                  '72f2990e8f906b589926b4290dd511bc846f0ac727c26fd7542f9db2.574d545f4144415f4e4654'
                ),
                quantity: 1n,
              },
              {
                asset: Asset.fromId(
                  '1d7f33bd23d85e1a25d87d86fac4f199c3197a2f7afeb662a0f34e1e.776f726c646d6f62696c65746f6b656e'
                ),
                quantity: 278623086n,
              },
            ],
          } as Utxo,
        ],
        fee: 0n,
        mints: [],
        datums: {},
        redeemers: [],
      })
    );

    // console.log(operations);
    expect(operations.length).toEqual(1);
    const [pool] = operations as [LiquidityPoolState];
    expect(pool).toBeInstanceOf(LiquidityPoolState);
    expect(pool.txHash).toEqual(expected.outputId.transactionId);
    expect(pool.dex).toEqual(Dex.Spectrum);
    expect(pool.tokenLp.policyId + '.' + pool.tokenLp.nameHex).toEqual(
      expected.lq.asset
    );
    expect(
      pool.tokenA ? pool.tokenA.policyId + '.' + pool.tokenA.nameHex : '.'
    ).toEqual(expected.x.asset);
    expect(pool.tokenB.policyId + '.' + pool.tokenB.nameHex).toEqual(
      expected.y.asset
    );
    expect(pool.reserveA).toEqual(
      (BigInt(expected.x.amount) - BigInt(expected.treasuryX)).toString()
    );
    expect(pool.reserveB).toEqual(
      (BigInt(expected.y.amount) - BigInt(expected.treasuryY)).toString()
    );
    expect(pool.extra.feeNumerator).toEqual(
      expected.poolFeeNumX - expected.treasuryFee
    );
  });

  it.skip('Can index cfmm v2 pools', async () => {
    const expected = {
      poolType: 'cfmm',
      id: 'e3a879f88db87ed3107502bf21f0f43a0210ac7546a54887f2c84d76.53554e4441455f4144415f4e4654',
      x: {
        asset: '.',
        amount: '7982184',
      },
      y: {
        asset:
          '9a9693a9a37912a5097918f97918d15240c92ab729a0b7c4aa144d77.53554e444145',
        amount: '923184446',
      },
      lq: {
        asset:
          '3a2a9affeed8376411dc7c42e4c0db52e85f65762d3328abe3969b98.53554e4441455f4144415f4c51',
        amount: '9223372036770160863',
      },
      outputId: {
        transactionId:
          '076b472ba87197f805d74b3d5bfb07e7559b5bb5601efd1e73738b1b445dea64',
        transactionIndex: 0,
      },
      poolFeeNumX: 997,
      poolFeeNumY: 997,
      treasuryFee: 0,
      treasuryX: 0,
      treasuryY: 0,
      royaltyFee: null,
      royaltyX: null,
      royaltyY: null,
      royaltyNonce: null,
      royaltyPk: null,
      royaltyUserAddress: null,
      verified: true,
      poolLqBound: 0,
      version: 'v2',
      timestamp: 1746803292,
      blockHeight: 11842435,
    };

    const operations: AmmDexOperation[] = await analyzer.analyzeTransaction(
      (globals.SPLASH_LP_STATE_ROYALTY_POOL_TX = {
        hash: '076b472ba87197f805d74b3d5bfb07e7559b5bb5601efd1e73738b1b445dea64',
        blockHash:
          '0244af51d6385c114b24bb97b3aafe5e094fb05b072d422f56ba68fef781d8e6',
        blockSlot: 153729615,
        inputs: [],
        outputs: [
          {
            forTxHash:
              '076b472ba87197f805d74b3d5bfb07e7559b5bb5601efd1e73738b1b445dea64',
            toAddress:
              'addr1x94ec3t25egvhqy2n265xfhq882jxhkknurfe9ny4rl9k6dj764lvrxdayh2ux30fl0ktuh27csgmpevdu89jlxppvrst84slu',
            datum:
              'd8799fd8799f581ce3a879f88db87ed3107502bf21f0f43a0210ac7546a54887f2c84d764e53554e4441455f4144415f4e4654ffd8799f4040ffd8799f581c9a9693a9a37912a5097918f97918d15240c92ab729a0b7c4aa144d774653554e444145ffd8799f581c3a2a9affeed8376411dc7c42e4c0db52e85f65762d3328abe3969b984d53554e4441455f4144415f4c51ff1903e58000ff',
            index: 0,
            lovelaceBalance: 7982184n,
            assetBalances: [
              {
                asset: Asset.fromId(
                  '3a2a9affeed8376411dc7c42e4c0db52e85f65762d3328abe3969b98.53554e4441455f4144415f4c51'
                ),
                quantity: 9223372036770160863n,
              },
              {
                asset: Asset.fromId(
                  '9a9693a9a37912a5097918f97918d15240c92ab729a0b7c4aa144d77.53554e444145'
                ),
                quantity: 923184446n,
              },
              {
                asset: Asset.fromId(
                  'e3a879f88db87ed3107502bf21f0f43a0210ac7546a54887f2c84d76.53554e4441455f4144415f4e4654'
                ),
                quantity: 1n,
              },
            ],
          } as Utxo,
        ],
        fee: 0n,
        mints: [],
        datums: {},
        redeemers: [],
      })
    );

    // console.log(operations);
    expect(operations.length).toEqual(1);
    const [pool] = operations as [LiquidityPoolState];
    expect(pool).toBeInstanceOf(LiquidityPoolState);
    expect(pool.txHash).toEqual(expected.outputId.transactionId);
    expect(pool.dex).toEqual(Dex.Spectrum);
    expect(pool.tokenLp.policyId + '.' + pool.tokenLp.nameHex).toEqual(
      expected.lq.asset
    );
    expect(
      pool.tokenA ? pool.tokenA.policyId + '.' + pool.tokenA.nameHex : '.'
    ).toEqual(expected.x.asset);
    expect(pool.tokenB.policyId + '.' + pool.tokenB.nameHex).toEqual(
      expected.y.asset
    );
    expect(BigInt(pool.reserveA)).toEqual(
      BigInt(expected.x.amount) - BigInt(expected.treasuryX)
    );
    expect(BigInt(pool.reserveB)).toEqual(
      BigInt(expected.y.amount) - BigInt(expected.treasuryY)
    );
    expect(pool.extra.feeNumerator).toEqual(
      expected.poolFeeNumX - expected.treasuryFee
    );
  });
});
