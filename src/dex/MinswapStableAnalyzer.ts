import { Data } from '@lucid-evolution/lucid';
import { DatumParameterKey, Dex } from '../constants';
import { Asset } from '../db/entities/Asset';
import { LiquidityPoolDeposit } from '../db/entities/LiquidityPoolDeposit';
import { LiquidityPoolState } from '../db/entities/LiquidityPoolState';
import { LiquidityPoolSwap } from '../db/entities/LiquidityPoolSwap';
import { LiquidityPoolWithdraw } from '../db/entities/LiquidityPoolWithdraw';
import { LiquidityPoolZap } from '../db/entities/LiquidityPoolZap';
import { DefinitionBuilder } from '../DefinitionBuilder';
import {
  AmmDexOperation,
  AssetBalance,
  DatumParameters,
  DefinitionConstr,
  DefinitionField,
  Transaction,
  Utxo,
} from '../types';
import { toDefinitionDatum } from '../utils';
import { BaseAmmDexAnalyzer } from './BaseAmmDexAnalyzer';
import poolDefinition from './definitions/minswap-stable/pool';

/**
 * Minswap constants.
 */
const MIN_ADA = 2_000_000n;
const BATCHER_FEE = 1_000_000n;
const KNOWN_POOLS = [
  {
    orderAddress: 'addr1w9xy6edqv9hkptwzewns75ehq53nk8t73je7np5vmj3emps698n9g',
    poolAddress: 'addr1wy7kkcpuf39tusnnyga5t2zcul65dwx9yqzg7sep3cjscesx2q5m5',
    nftAsset:
      '5d4b6afd3344adcf37ccef5558bb87f522874578c32f17160512e398444a45442d695553442d534c50',
    lpAsset:
      '2c07095028169d7ab4376611abef750623c8f955597a38cd15248640444a45442d695553442d534c50',
    assets: [
      '8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd61446a65644d6963726f555344',
      'f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b6988069555344',
    ],
    multiples: [1n, 1n],
    fee: 1000000n,
    adminFee: 5000000000n,
    feeDenominator: 10000000000n,
  },
  {
    orderAddress: 'addr1w93d8cuht3hvqt2qqfjqgyek3gk5d6ss2j93e5sh505m0ng8cmze2',
    poolAddress: 'addr1wx8d45xlfrlxd7tctve8xgdtk59j849n00zz2pgyvv47t8sxa6t53',
    nftAsset:
      'd97fa91daaf63559a253970365fb219dc4364c028e5fe0606cdbfff9555344432d444a45442d534c50',
    lpAsset:
      'ac49e0969d76ed5aa9e9861a77be65f4fc29e9a979dc4c37a99eb8f4555344432d444a45442d534c50',
    assets: [
      '25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff93555534443',
      '8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd61446a65644d6963726f555344',
    ],
    multiples: [1n, 100n],
    fee: 1000000n,
    adminFee: 5000000000n,
    feeDenominator: 10000000000n,
  },
  {
    orderAddress: 'addr1wxtv9k2lcum5pmcc4wu44a5tufulszahz84knff87wcawycez9lug',
    poolAddress: 'addr1w9520fyp6g3pjwd0ymfy4v2xka54ek6ulv4h8vce54zfyfcm2m0sm',
    nftAsset:
      '96402c6f5e7a04f16b4d6f500ab039ff5eac5d0226d4f88bf5523ce85553444d2d695553442d534c50',
    lpAsset:
      '31f92531ac9f1af3079701fab7c66ce997eb07988277ee5b9d6403015553444d2d695553442d534c50',
    assets: [
      'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d',
      'f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b6988069555344',
    ],
    multiples: [1n, 1n],
    fee: 1000000n,
    adminFee: 5000000000n,
    feeDenominator: 10000000000n,
  },
  {
    orderAddress: 'addr1wxr9ppdymqgw6g0hvaaa7wc6j0smwh730ujx6lczgdynehsguav8d',
    poolAddress: 'addr1wxxdvtj6y4fut4tmu796qpvy2xujtd836yg69ahat3e6jjcelrf94',
    nftAsset:
      '07b0869ed7488657e24ac9b27b3f0fb4f76757f444197b2a38a15c3c444a45442d5553444d2d534c50',
    lpAsset:
      '5b042cf53c0b2ce4f30a9e743b4871ad8c6dcdf1d845133395f55a8e444a45442d5553444d2d534c50',
    assets: [
      '8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd61446a65644d6963726f555344',
      'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d',
    ],
    multiples: [1n, 1n],
    fee: 1000000n,
    adminFee: 5000000000n,
    feeDenominator: 10000000000n,
  },
  {
    orderAddress: 'addr1w9ksys0l07s9933kgkn4uxylsss5k6lqvt6e66kfc7am9sgtwqgv0',
    poolAddress: 'addr1wx87yvnhj78yehh64unc7hr02dx73vmpedktz79xy2n3xxgs3t38l',
    nftAsset:
      '4e73e9cf8fd73e74956c67fa3a01486f02ab612ee580dc27755b8d57444a45442d4d795553442d534c50',
    lpAsset:
      'b69f5d48c91297142c46b764b69ab57844e3e7af9d7ba9bc63c3c517444a45442d4d795553442d534c50',
    assets: [
      '8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd61446a65644d6963726f555344',
      '92776616f1f32c65a173392e4410a3d8c39dcf6ef768c73af164779c4d79555344',
    ],
    multiples: [1n, 1n],
    fee: 1000000n,
    adminFee: 5000000000n,
    feeDenominator: 10000000000n,
  },
  {
    orderAddress: 'addr1w8akt26kwj9kc2y56p8x3s9e9lp2qqtcxql0rmnz55u6lks99kkjc',
    poolAddress: 'addr1wxcsnc9wzuczcmcctzpl9c0w4r84f73rsmwl8ce8d9n54ygep9znj',
    nftAsset:
      '1d4c43ac86463f93c4cba60c28f143b2781d7f7328b18d8e68298e614d795553442d5553444d2d534c50',
    lpAsset:
      '5827249dcaf49ce7ccae2e0577fd9bf9514a4c34adabc7eb57e192594d795553442d5553444d2d534c50',
    assets: [
      '92776616f1f32c65a173392e4410a3d8c39dcf6ef768c73af164779c4d79555344',
      'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d',
    ],
    multiples: [1n, 1n],
    fee: 1000000n,
    adminFee: 5000000000n,
    feeDenominator: 10000000000n,
  },
  {
    orderAddress: 'addr1w86a53qhsmh0qszg486ell6nchy77yq6txksfz8p4z4r39cd4e04m',
    poolAddress: 'addr1wytm0yuffszdzkme56mlm07htw388vkny2wy49ch7c3p57s4wwk57',
    nftAsset:
      '3ff28ad0d4788f24619746cc86b774495ed4727634b61710d2bb7ed5555344432d695553442d534c50',
    lpAsset:
      '40b6f8a17ba5d9bab02fc776c9677212b40bfc3df77346f0b1edcba6555344432d695553442d534c50',
    assets: [
      '25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff93555534443',
      'f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b6988069555344',
    ],
    multiples: [1n, 100n],
    fee: 1000000n,
    adminFee: 5000000000n,
    feeDenominator: 10000000000n,
  },
  {
    orderAddress: 'addr1wy42rt3rdptdaa2lwlntkx49ksuqrmqqjlu7pf5l5f8upmgj3gq2m',
    poolAddress: 'addr1wx4w03kq5tfhaad2fmglefgejj0anajcsvvg88w96lrmylc7mx5rm',
    nftAsset:
      '739150a2612da82e16adc2a3a1f88b256202d8415df0c5b7a2ff93fb555344432d695553442d302e312d534c50',
    lpAsset:
      '48bee898de501ff287165fdfc5be34818f3a41e474ae8f47f8c59f7a555344432d695553442d302e312d534c50',
    assets: [
      '25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff93555534443',
      'f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b6988069555344',
    ],
    multiples: [1n, 100n],
    fee: 10000000n,
    adminFee: 500000000n,
    feeDenominator: 10000000000n,
  },
  {
    orderAddress: 'addr1w8cafpjmeer4j8t8aseqayhwkf4ezuufue0clvfthxecsacv83rt0',
    poolAddress: 'addr1wywdvw0qwv2n97e8y5jsfqq3qryu6re3gxwqcc7fzscpwugxz5dwe',
    nftAsset:
      'a0d806e67be578911ca39260cff5eaa6eb06f9f4165ccd570282f5055553444d2d555344412d534c50',
    lpAsset:
      '5f0d38b3eb8fea72cd3cbdaa9594a74d0db79b5a27e85be5e9015bd65553444d2d555344412d534c50',
    assets: [
      'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d',
      'fe7c786ab321f41c654ef6c1af7b3250a613c24e4213e0425a7ae45655534441',
    ],
    multiples: [1n, 1n],
    fee: 5000000n,
    adminFee: 500000000n,
    feeDenominator: 10000000000n,
  },
  {
    orderAddress: 'addr1w83fd654hwp5kzqkae4hqrasprq72tt4ppeghy20706jweqrcqkf3',
    poolAddress: 'addr1wyge54qpez2zc250f8frwtksjzrg4l6n5cs34psqas9uz0syae9sf',
    nftAsset:
      'b7ff73b687f4abdec86ca9984faa70dfead433588f183c3f956fb213695553442d555344412d534c50',
    lpAsset:
      '5fd1180269cd5a01f397f37a17981424a3ec3bdab1e743a61f3bb113695553442d555344412d534c50',
    assets: [
      'f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b6988069555344',
      'fe7c786ab321f41c654ef6c1af7b3250a613c24e4213e0425a7ae45655534441',
    ],
    multiples: [1n, 1n],
    fee: 10000000n,
    adminFee: 500000000n,
    feeDenominator: 10000000000n,
  },
  {
    orderAddress: 'addr1wykr5fpg2qjca5lt75qmh9g459vnwr08wj5xlfcwyleyqagryre2v',
    poolAddress: 'addr1wxzuzc4279crnjeln9yae4lutkqsyz7trrwhvnfty8wa40q2zzcsm',
    nftAsset:
      '6d0af21948cca104be7e639ed7d9a169f15b7763c066df41ec4b29b8774554482d694554482d534c50',
    lpAsset:
      'b6b60bf469adb18c21ff3ad06bbdb9e78327b34d4c15db162de53b1c774554482d694554482d534c50',
    assets: [
      '25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935455448',
      'f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b6988069455448',
    ],
    multiples: [1n, 100n],
    fee: 10000000n,
    adminFee: 500000000n,
    feeDenominator: 10000000000n,
  },
  {
    orderAddress: 'addr1wx0mfd2vxe6x80fa50fw325n2ufnaaa53xkmrnuukt5d6uqyjjvj4',
    poolAddress: 'addr1w90vp068jkxl5cx77w6wj6ufj5l628uec2y0eds5jhumn3chscq35',
    nftAsset:
      '6bdc0ad93ceb1f1df8f4be04d8037bc5d8dc21e5c8d654b48a9679f8774254432d694254432d534c50',
    lpAsset:
      'd4e0b170fc503735b260b1a0c99223c2b4e6dd6e87ccdcabfba28b8a774254432d694254432d534c50',
    assets: [
      '25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935425443',
      'f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b6988069425443',
    ],
    multiples: [1n, 100n],
    fee: 10000000n,
    adminFee: 500000000n,
    feeDenominator: 10000000000n,
  },
  {
    orderAddress: 'addr1wxaw7dge3st4v7jreug6t5zfhqlkvsjpkddxvm6e3rcgpysxvuf5z',
    poolAddress: 'addr1wx302gec6k43m8cvvqa9rsr3dz40a0657hts3v4tuuvc33svhaqu9',
    nftAsset:
      '666c65d6d6152864ef16371beed29150259564bde5a30d345c5e236977534f4c2d69534f4c2d534c50',
    lpAsset:
      'd3facc199b218a60723500bb80fcfc091f5bd67bdb74df4c099d817477534f4c2d69534f4c2d534c50',
    assets: [
      '25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935534f4c',
      'f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b6988069534f4c',
    ],
    multiples: [1n, 100n],
    fee: 10000000n,
    adminFee: 500000000n,
    feeDenominator: 10000000000n,
  },
];

export class MinswapStableAnalyzer extends BaseAmmDexAnalyzer {
  public startSlot: number = 56553560;

  /**
   * Analyze transaction for possible DEX operations.
   */
  public async analyzeTransaction(
    transaction: Transaction
  ): Promise<AmmDexOperation[]> {
    return Promise.all([this.liquidityPoolStates(transaction)]).then(
      (operations: AmmDexOperation[][]) => operations.flat()
    );
  }

  /**
   * Check for swap orders in transaction.
   */
  protected swapOrders(transaction: Transaction): LiquidityPoolSwap[] {
    return [];
  }

  /**
   * Check for ZAP orders in transaction.
   */
  protected zapOrders(transaction: Transaction): Promise<LiquidityPoolZap[]> {
    return Promise.resolve([]);
  }

  /**
   * Check for updated liquidity pool states in transaction.
   */
  protected liquidityPoolStates(
    transaction: Transaction
  ): LiquidityPoolState[] {
    return transaction.outputs
      .map((output: Utxo) => {
        const hasPoolNft: boolean = output.assetBalances.some(
          (balance: AssetBalance) => {
            return KNOWN_POOLS.some(
              (pool) => pool.nftAsset === balance.asset.identifier()
            );
          }
        );

        const hasPoolAddress = KNOWN_POOLS.some(
          (pool) => pool.poolAddress === output.toAddress
        );

        const pool = KNOWN_POOLS.find(
          (pool) => pool.poolAddress === output.toAddress
        );

        if (!output.datum || !hasPoolNft || !hasPoolAddress || !pool) {
          return undefined;
        }

        try {
          const datum = Data.from(output.datum);
          const definitionField: DefinitionField = toDefinitionDatum(datum);
          const builder: DefinitionBuilder = new DefinitionBuilder(
            poolDefinition
          );
          const datumParameters: DatumParameters = builder.pullParameters(
            definitionField as DefinitionConstr
          );

          const tokenA = Asset.fromId(pool.assets[0]);
          const tokenB = Asset.fromId(pool.assets[1]);
          const lpToken = Asset.fromId(pool.lpAsset);

          const reserveA =
            output.assetBalances.find(
              (balance: AssetBalance) =>
                balance.asset.identifier() === tokenA.identifier()
            )?.quantity ?? 0n;

          const reserveB =
            output.assetBalances.find(
              (balance: AssetBalance) =>
                balance.asset.identifier() === tokenB.identifier()
            )?.quantity ?? 0n;

          return LiquidityPoolState.make(
            Dex.MinswapStable,
            output.toAddress,
            pool.nftAsset,
            tokenA,
            tokenB,
            lpToken,
            String(reserveA),
            String(reserveB),
            Number(datumParameters.TotalLpTokens),
            Number(pool.fee * 100n) / Number(pool.feeDenominator),
            transaction.blockSlot,
            transaction.hash,
            undefined,
            transaction.inputs,
            transaction.outputs.filter(
              (sibling: Utxo) => sibling.index !== output.index
            ),
            {
              [DatumParameterKey.Amp]: String(datumParameters.Amp),
              [DatumParameterKey.Balance0]: String(datumParameters.Balance0),
              [DatumParameterKey.Balance1]: String(datumParameters.Balance1),
              [DatumParameterKey.Multiplier0]: pool.multiples[0].toString(),
              [DatumParameterKey.Multiplier1]: pool.multiples[1].toString(),
              feeNumerator: Number(pool.fee),
              feeDenominator: Number(pool.feeDenominator),
              txHash: transaction.hash,
              minAda: MIN_ADA.toString(),
              batcherFee: BATCHER_FEE.toString(),
            }
          );
        } catch (e) {
          console.error("Error while parsing LiquidityPoolState datum:", e);
          return undefined;
        }
      })
      .flat()
      .filter(
        (operation: LiquidityPoolState | undefined) => operation !== undefined
      ) as LiquidityPoolState[];
  }

  /**
   * Check for liquidity pool deposits in transaction.
   */
  protected depositOrders(transaction: Transaction): LiquidityPoolDeposit[] {
    return [];
  }

  /**
   * Check for liquidity pool withdraws in transaction.
   */
  protected withdrawOrders(transaction: Transaction): LiquidityPoolWithdraw[] {
    return [];
  }
}
