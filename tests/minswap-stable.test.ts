import { Asset } from '../src/db/entities/Asset';
import { LiquidityPoolState } from '../src/db/entities/LiquidityPoolState';
import { BaseAmmDexAnalyzer } from '../src/dex/BaseAmmDexAnalyzer';
import { MinswapStableAnalyzer } from '../src/dex/MinswapStableAnalyzer';
import { Utxo } from '../src/types';
import { ASSETS } from './fixtures';
import { globals } from './setup';

describe('MinswapStable', () => {
  const analyzer: BaseAmmDexAnalyzer = new MinswapStableAnalyzer(globals.app);

  it('Can index USDC-iUSD pool', async () => {
    // https://cardanoscan.io/transaction/fe0dbbced37a4a0d19a22a14504441bbbd8a6de46590822b6cf6fddb1cebea2c?tab=summary
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
    expect(pool.extra.Amp).toEqual('10');
    expect(pool.extra.feeNumerator).toEqual(1000000);
    expect(pool.extra.feeDenominator).toEqual(10000000000);
    expect(pool.extra.Balance0).toEqual('258614009000');
    expect(pool.extra.Balance1).toEqual('2041864596');
    expect(pool.extra.Multiplier0).toEqual('1');
    expect(pool.extra.Multiplier1).toEqual('100');
    expect(pool.reserveA).toEqual('258616528493');
    expect(pool.reserveB).toEqual('2041947441');

    expect(pool.tokenA?.identifier()).toEqual(ASSETS.USDC.identifier());
    expect(pool.tokenB?.identifier()).toEqual(ASSETS.iUSD.identifier());
  });

  it('Can index DJED-iUSD pool', async () => {
    // https://cardanoscan.io/transaction/fca8f842f0a36b63c05b82c69b62207d4ca77578067796e1ac092f4c6f844923?tab=summary
    const txn = {
      hash: 'fca8f842f0a36b63c05b82c69b62207d4ca77578067796e1ac092f4c6f844923',
      blockHash:
        '0244af51d6385c114b24bb97b3aafe5e094fb05b072d422f56ba68fef781d8e6',
      blockSlot: 153729615,
      inputs: [],
      outputs: [
        {
          forTxHash:
            'fca8f842f0a36b63c05b82c69b62207d4ca77578067796e1ac092f4c6f844923',
          toAddress:
            'addr1wy7kkcpuf39tusnnyga5t2zcul65dwx9yqzg7sep3cjscesx2q5m5',
          datum:
            'd8799f9f1b00000005b788dbb31b00000003ee379b0bff1b000000099590fb540a581c4c4d65a0616f60adc2cba70f533705233b1d7e8cb3e9868cdca39d86ff',
          index: 0,
          lovelaceBalance: 1792960n,
          assetBalances: [
            {
              asset: ASSETS.DJED,
              quantity: 24755170850n,
            },
            {
              asset: Asset.fromId(
                '5d4b6afd3344adcf37ccef5558bb87f522874578c32f17160512e398.444a45442d695553442d534c50'
              ),
              quantity: 1n,
            },
            {
              asset: ASSETS.iUSD,
              quantity: 17088347252n,
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
    expect(pool.extra.Amp).toEqual('10');
    expect(pool.extra.feeNumerator).toEqual(1000000);
    expect(pool.extra.feeDenominator).toEqual(10000000000);
    expect(pool.extra.Balance0).toEqual('24554036147');
    expect(pool.extra.Balance1).toEqual('16881523467');
    expect(pool.extra.Multiplier0).toEqual('1');
    expect(pool.extra.Multiplier1).toEqual('1');
    expect(pool.reserveA).toEqual('24755170850');
    expect(pool.reserveB).toEqual('17088347252');

    expect(pool.tokenA?.identifier()).toEqual(ASSETS.DJED.identifier());
    expect(pool.tokenB?.identifier()).toEqual(ASSETS.iUSD.identifier());
  });

  it('Can index USDC-DJED pool', async () => {
    // https://cardanoscan.io/transaction/3202cd487d26988dc50f116ce506d5906efdeaeea4204964c59d2b8259459619
    const txn = {
      hash: '3202cd487d26988dc50f116ce506d5906efdeaeea4204964c59d2b8259459619',
      blockHash:
        '0244af51d6385c114b24bb97b3aafe5e094fb05b072d422f56ba68fef781d8e6',
      blockSlot: 153729615,
      inputs: [],
      outputs: [
        {
          forTxHash:
            '3202cd487d26988dc50f116ce506d5906efdeaeea4204964c59d2b8259459619',
          toAddress:
            'addr1wx8d45xlfrlxd7tctve8xgdtk59j849n00zz2pgyvv47t8sxa6t53',
          datum:
            'd8799f9f1b000001e908e53fe81b0000000553ffce6cff1b000003f2130517ae0a581c62d3e3975c6ec02d4002640413368a2d46ea10548b1cd217a3e9b7cdff',
          index: 0,
          lovelaceBalance: 1792960n,
          assetBalances: [
            {
              asset: ASSETS.DJED,
              quantity: 23297156355n,
            },
            {
              asset: Asset.fromId(
                'd97fa91daaf63559a253970365fb219dc4364c028e5fe0606cdbfff9.555344432d444a45442d534c50'
              ),
              quantity: 1n,
            },
            {
              asset: ASSETS.USDC,
              quantity: 2142104761098n,
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
    expect(pool.extra.Amp).toEqual('10');
    expect(pool.extra.feeNumerator).toEqual(1000000);
    expect(pool.extra.feeDenominator).toEqual(10000000000);
    expect(pool.extra.Balance0).toEqual('2100388249576');
    expect(pool.extra.Balance1).toEqual('22884109932');
    expect(pool.extra.Multiplier0).toEqual('1');
    expect(pool.extra.Multiplier1).toEqual('100');
    expect(pool.reserveA).toEqual('2142104761098');
    expect(pool.reserveB).toEqual('23297156355');

    expect(pool.tokenA?.identifier()).toEqual(ASSETS.USDC.identifier());
    expect(pool.tokenB?.identifier()).toEqual(ASSETS.DJED.identifier());
  });

  it('Can index USDM-iUSD pool', async () => {
    // https://cardanoscan.io/transaction/1839c260d398a947f89f3b28539f2f29ee762a46476a2381669cd90e33bf2ce8
    const txn = {
      hash: '1839c260d398a947f89f3b28539f2f29ee762a46476a2381669cd90e33bf2ce8',
      blockHash:
        '0244af51d6385c114b24bb97b3aafe5e094fb05b072d422f56ba68fef781d8e6',
      blockSlot: 153729615,
      inputs: [],
      outputs: [
        {
          forTxHash:
            '1839c260d398a947f89f3b28539f2f29ee762a46476a2381669cd90e33bf2ce8',
          toAddress:
            'addr1w9520fyp6g3pjwd0ymfy4v2xka54ek6ulv4h8vce54zfyfcm2m0sm',
          datum:
            'd8799f9f1b0000009c096a13991b0000006a0e703f68ff1b00000105781d44220a581c96c2d95fc73740ef18abb95af68be279f80bb711eb69a527f3b1d713ff',
          index: 0,
          lovelaceBalance: 1792960n,
          assetBalances: [
            {
              asset: ASSETS.USDM,
              quantity: 670468849986n,
            },
            {
              asset: Asset.fromId(
                '96402c6f5e7a04f16b4d6f500ab039ff5eac5d0226d4f88bf5523ce8.5553444d2d695553442d534c50'
              ),
              quantity: 1n,
            },
            {
              asset: ASSETS.iUSD,
              quantity: 455778331569n,
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
    expect(pool.extra.Amp).toEqual('10');
    expect(pool.extra.feeNumerator).toEqual(1000000);
    expect(pool.extra.feeDenominator).toEqual(10000000000);
    expect(pool.extra.Balance0).toEqual('670172844953');
    expect(pool.extra.Balance1).toEqual('455508770664');
    expect(pool.extra.Multiplier0).toEqual('1');
    expect(pool.extra.Multiplier1).toEqual('1');
    expect(pool.reserveA).toEqual('670468849986');
    expect(pool.reserveB).toEqual('455778331569');

    expect(pool.tokenA?.identifier()).toEqual(ASSETS.USDM.identifier());
    expect(pool.tokenB?.identifier()).toEqual(ASSETS.iUSD.identifier());
  });

  it('Can filter non-related transactions', async () => {
    const operations = await analyzer.analyzeTransaction(
      globals.SUNDAESWAP_SWAP_TX
    );

    expect(operations.length).toEqual(0);
  });
});
