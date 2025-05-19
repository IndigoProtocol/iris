import { Dex } from '../src/constants';
import { Asset } from '../src/db/entities/Asset';
import { LiquidityPoolState } from '../src/db/entities/LiquidityPoolState';
import { BaseAmmDexAnalyzer } from '../src/dex/BaseAmmDexAnalyzer';
import { SplashAnalyzer } from '../src/dex/SplashAnalyzer';
import { AmmDexOperation, Utxo } from '../src/types';
import { globals } from './setup';

describe('Minswap', () => {
  const analyzer: BaseAmmDexAnalyzer = new SplashAnalyzer(globals.app);

  it('Can index cfmm v1 pools', async () => {
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
                  '1d7f33bd23d85e1a25d87d86fac4f199c3197a2f7afeb662a0f34e1e.2347062'
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

    console.log(operations);

    expect(operations.length).toEqual(1);
    expect(operations[0]).toBeInstanceOf(LiquidityPoolState);
    expect(operations[0].txHash).toEqual(
      globals.SPLASH_LP_STATE_ROYALTY_POOL_TX.hash
    );
    expect(expected).toBeTruthy();
  });

  it('Can index cfmm v2 pools', async () => {
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

    console.log(operations);

    expect(operations.length).toEqual(1);
    expect(operations[0]).toBeInstanceOf(LiquidityPoolState);
    expect(operations[0].txHash).toEqual(
      globals.SPLASH_LP_STATE_ROYALTY_POOL_TX.hash
    );
    expect(expected).toBeTruthy();
  });

  it('Can index cfmm v4 pools', async () => {
    const expected = {
      poolType: 'cfmm',
      id: '5cb6e093f8a900f82ad299c807511b9faf2273adbac58cf4a35a4c99.72734552475f4144415f4e4654',
      x: {
        asset: '.',
        amount: '517079464263',
      },
      y: {
        asset:
          '04b95368393c821f180deee8229fbd941baaf9bd748ebcdbf7adbb14.7273455247',
        amount: '460699185372213',
      },
      lq: {
        asset:
          '84e481732b09cef3a4e13b4cae97630fc680dce0429691432f07b2ba.72734552475f4144415f4c51',
        amount: '9223358819775129168',
      },
      outputId: {
        transactionId:
          '6174bd12743ffd60d2b63759ee4e3c3c8e2499622f19231646a5d94d6242add4',
        transactionIndex: 0,
      },
      poolFeeNumX: 99100,
      poolFeeNumY: 99100,
      treasuryFee: 90,
      treasuryX: 8275401719,
      treasuryY: 4829701052166,
      royaltyFee: null,
      royaltyX: null,
      royaltyY: null,
      royaltyNonce: null,
      royaltyPk: null,
      royaltyUserAddress: null,
      verified: true,
      poolLqBound: 0,
      version: 'v4',
      timestamp: 1747612448,
      blockHeight: 11882375,
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
              '6174bd12743ffd60d2b63759ee4e3c3c8e2499622f19231646a5d94d6242add4',
            toAddress:
              'addr1x8cq97k066w4rd37wprvd4qrfxctzlyd6a67us2uv6hnen9j764lvrxdayh2ux30fl0ktuh27csgmpevdu89jlxppvrsgzvahe',
            datum:
              'd8799fd8799f581c5cb6e093f8a900f82ad299c807511b9faf2273adbac58cf4a35a4c994d72734552475f4144415f4e4654ffd8799f4040ffd8799f581c04b95368393c821f180deee8229fbd941baaf9bd748ebcdbf7adbb14457273455247ffd8799f581c84e481732b09cef3a4e13b4cae97630fc680dce0429691432f07b2ba4c72734552475f4144415f4c51ff1a0001831c185a1b00000001ed409bf71b00000464809d97069fd87981d87a81581cea4ba6a9813d12b889a4d34308b08e283ba2ddb92dd30c4fcbe48062ff00581c75c4570eb625ae881b32a34c52b159f6f3f3f2c7aaabf5bac4688133ff',
            index: 0,
            lovelaceBalance: 517079464263n,
            assetBalances: [
              {
                asset: Asset.fromId(
                  '04b95368393c821f180deee8229fbd941baaf9bd748ebcdbf7adbb14.7273455247'
                ),
                quantity: 460699185372213,
              },
              {
                asset: Asset.fromId(
                  '5cb6e093f8a900f82ad299c807511b9faf2273adbac58cf4a35a4c99.72734552475f4144415f4e4654'
                ),
                quantity: 1n,
              },
              {
                asset: Asset.fromId(
                  '84e481732b09cef3a4e13b4cae97630fc680dce0429691432f07b2ba.72734552475f4144415f4c51'
                ),
                quantity: 9223358819775129168n,
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

    console.log(operations);

    expect(operations.length).toEqual(1);
    expect(operations[0]).toBeInstanceOf(LiquidityPoolState);
    expect(operations[0].txHash).toEqual(
      globals.SPLASH_LP_STATE_ROYALTY_POOL_TX.hash
    );
    expect(expected).toBeTruthy();
  });

  it.only('Can index cfmm v5 pools', async () => {
    const expected = {
      poolType: 'cfmm',
      id: 'e73e65176c6bd31dbc878e317e852c826a534fb949d279a463ecbd18.535452494b455f4144415f4e4654',
      x: {
        asset: '.',
        amount: '763498300787',
      },
      y: {
        asset:
          'f13ac4d66b3ee19a6aa0f2a22298737bd907cc95121662fc971b5275.535452494b45',
        amount: '1531910450540',
      },
      lq: {
        asset:
          'fc7116c81a475ea2fcc3ec56a40802aed4899c2e23a23cd4d08ad772.535452494b455f4144415f4c51',
        amount: '9223370981709398904',
      },
      outputId: {
        transactionId:
          'a73556e9ec78372913cdae75d59febdae178400aecdeaee3cafd583d8e07c2d6',
        transactionIndex: 0,
      },
      poolFeeNumX: 99100,
      poolFeeNumY: 99100,
      treasuryFee: 100,
      treasuryX: 1495454012,
      treasuryY: 4664329422,
      royaltyFee: null,
      royaltyX: null,
      royaltyY: null,
      royaltyNonce: null,
      royaltyPk: null,
      royaltyUserAddress: null,
      verified: true,
      poolLqBound: 0,
      version: 'v5',
      timestamp: 1747627219,
      blockHeight: 11883152,
    };

    const operations: AmmDexOperation[] = await analyzer.analyzeTransaction(
      (globals.SPLASH_LP_STATE_ROYALTY_POOL_TX = {
        hash: 'a73556e9ec78372913cdae75d59febdae178400aecdeaee3cafd583d8e07c2d6',
        blockHash:
          '0244af51d6385c114b24bb97b3aafe5e094fb05b072d422f56ba68fef781d8e6',
        blockSlot: 153729615,
        inputs: [],
        outputs: [
          {
            forTxHash:
              'a73556e9ec78372913cdae75d59febdae178400aecdeaee3cafd583d8e07c2d6',
            toAddress:
              'addr1xxw7upjedpkr4wq839wf983jsnq3yg40l4cskzd7dy8eyndj764lvrxdayh2ux30fl0ktuh27csgmpevdu89jlxppvrsgddq74',
            datum:
              'd8799fd8799f581ce73e65176c6bd31dbc878e317e852c826a534fb949d279a463ecbd184e535452494b455f4144415f4e4654ffd8799f4040ffd8799f581cf13ac4d66b3ee19a6aa0f2a22298737bd907cc95121662fc971b527546535452494b45ffd8799f581cfc7116c81a475ea2fcc3ec56a40802aed4899c2e23a23cd4d08ad7724d535452494b455f4144415f4c51ff1a0001831c18641a5922d13c1b00000001160404ce9fd87981d87a81581c9b1f98ce88e2b964e554eba1136fb8f0b284fcfb8df9c2d35c4fcf28ff00581c75c4570eb625ae881b32a34c52b159f6f3f3f2c7aaabf5bac4688133ff',
            index: 0,
            lovelaceBalance: 763498300787n,
            assetBalances: [
              {
                asset: Asset.fromId(
                  'e73e65176c6bd31dbc878e317e852c826a534fb949d279a463ecbd18.535452494b455f4144415f4e4654'
                ),
                quantity: 1n,
              },
              {
                asset: Asset.fromId(
                  'f13ac4d66b3ee19a6aa0f2a22298737bd907cc95121662fc971b5275.535452494b45'
                ),
                quantity: 1531910450540n,
              },
              {
                asset: Asset.fromId(
                  'fc7116c81a475ea2fcc3ec56a40802aed4899c2e23a23cd4d08ad772.535452494b455f4144415f4c51'
                ),
                quantity: 9223370981709398904n,
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

    expect(operations.length).toEqual(1);
    const [pool] = operations as [LiquidityPoolState];
    expect(pool).toBeInstanceOf(LiquidityPoolState);
    expect(pool.txHash).toEqual(expected.outputId.transactionId);
    expect(pool.dex).toEqual(Dex.Splash);
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

  it.only('Can index cfmm v6 pools', async () => {
    const expected = {
      poolType: 'cfmm',
      id: '7b5dee4d7c3d06882cd52d659b4822f4366ba402053d0e691f1e1ed4.48554e545f4144415f4e4654',
      x: {
        asset: '.',
        amount: '549289592220',
      },
      y: {
        asset:
          '95a427e384527065f2f8946f5e86320d0117839a5e98ea2c0b55fb00.48554e54',
        amount: '4599817254950',
      },
      lq: {
        asset:
          'f81d167a2b42699fb3b142135c78d059b80d97e96eb714ef0f424f27.48554e545f4144415f4c51',
        amount: '9223370479564909632',
      },
      outputId: {
        transactionId:
          'f1ecf1f379dad6fd3f394bf5e5d47f9ddd847536c2508357056cb1a0dea9ee96',
        transactionIndex: 1,
      },
      poolFeeNumX: 99190,
      poolFeeNumY: 99190,
      treasuryFee: 90,
      treasuryX: 1176935018,
      treasuryY: 8589245205,
      royaltyFee: 100,
      royaltyX: 411334926,
      royaltyY: 3746026132,
      royaltyNonce: 6,
      royaltyPk:
        '865319d2f869744b70e99c9c44b7b2f3b35aa69d37fb6f4c1c7fbd06848d8abe',
      royaltyUserAddress:
        '01115c5bf61455f33727c2c08c9a7446bf28cee459d0fb3b92545bc249777a8ec7667d48bf50ae722cf71da2e20d6ca049b930579453dcbac9',
      verified: true,
      poolLqBound: 0,
      version: 'v6',
      timestamp: 1747607522,
      blockHeight: 11882131,
    };

    const operations: AmmDexOperation[] = await analyzer.analyzeTransaction(
      (globals.SPLASH_LP_STATE_ROYALTY_POOL_TX = {
        hash: 'f1ecf1f379dad6fd3f394bf5e5d47f9ddd847536c2508357056cb1a0dea9ee96',
        blockHash:
          '0244af51d6385c114b24bb97b3aafe5e094fb05b072d422f56ba68fef781d8e6',
        blockSlot: 153729615,
        inputs: [],
        outputs: [
          {
            forTxHash:
              'f1ecf1f379dad6fd3f394bf5e5d47f9ddd847536c2508357056cb1a0dea9ee96',
            toAddress:
              'addr1x89ksjnfu7ys02tedvslc9g2wk90tu5qte0dt4dge60hdudj764lvrxdayh2ux30fl0ktuh27csgmpevdu89jlxppvrsg0g63z',
            datum:
              'd8799fd87982581c7b5dee4d7c3d06882cd52d659b4822f4366ba402053d0e691f1e1ed44c48554e545f4144415f4e4654d879824040d87982581c95a427e384527065f2f8946f5e86320d0117839a5e98ea2c0b55fb004448554e54d87982581cf81d167a2b42699fb3b142135c78d059b80d97e96eb714ef0f424f274b48554e545f4144415f4c511a00018376185a18641a46269a6a1b00000001fff57b151a1884790e1adf47d2949fd8799fd87a9f581c66e711a4bf9ddf46ff239143870b6893055a4fd4dea9f99fed6665cdffffff581c75c4570eb625ae881b32a34c52b159f6f3f3f2c7aaabf5bac46881335820865319d2f869744b70e99c9c44b7b2f3b35aa69d37fb6f4c1c7fbd06848d8abe06ff',
            index: 1,
            lovelaceBalance: 549289592220n,
            assetBalances: [
              {
                asset: Asset.fromId(
                  '7b5dee4d7c3d06882cd52d659b4822f4366ba402053d0e691f1e1ed4.48554e545f4144415f4e4654'
                ),
                quantity: 1n,
              },
              {
                asset: Asset.fromId(
                  '95a427e384527065f2f8946f5e86320d0117839a5e98ea2c0b55fb00.48554e54'
                ),
                quantity: 4599817254950n,
              },
              {
                asset: Asset.fromId(
                  'f81d167a2b42699fb3b142135c78d059b80d97e96eb714ef0f424f27.48554e545f4144415f4c51'
                ),
                quantity: 9223370479564909632n,
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

    expect(operations.length).toEqual(1);
    const [pool] = operations as [LiquidityPoolState];
    expect(pool).toBeInstanceOf(LiquidityPoolState);
    expect(pool.txHash).toEqual(expected.outputId.transactionId);
    expect(pool.dex).toEqual(Dex.Splash);
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
      BigInt(expected.x.amount) -
        BigInt(expected.treasuryX) -
        BigInt(expected.royaltyX)
    );
    expect(BigInt(pool.reserveB)).toEqual(
      BigInt(expected.y.amount) -
        BigInt(expected.treasuryY) -
        BigInt(expected.royaltyY)
    );
    expect(pool.extra.feeNumerator).toEqual(
      expected.poolFeeNumX - expected.treasuryFee - expected.royaltyFee
    );
  });

  it.todo('Can index balance pools');
  it.todo('Can index fee switch pools');
});
