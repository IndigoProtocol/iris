import { jest } from '@jest/globals';
import { Transaction, Utxo } from '../src/types';
import { BaseEntity } from 'typeorm';
import { IndexerApplication } from '../src/IndexerApplication';
import { Asset } from '../src/db/entities/Asset';

jest.mock('typeorm', () => {
  return {
    BaseEntity: () => BaseEntity,
    Entity: () => {},
    PrimaryGeneratedColumn: () => {},
    OneToMany: () => {},
    ManyToOne: () => {},
  };
});

//  Global vars
const app: IndexerApplication = new IndexerApplication();
await app.cache.boot();

/**
 * SundaeSwap
 */
const SUNDAESWAP_SWAP_TX: Transaction = {
  hash: 'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
  blockHash: '3eac1a7e6bf815e62109019bc933e197eef28d953ccce2b5e092ebee1afedb98',
  blockSlot: 54902346,
  inputs: [],
  outputs: [
    {
      forTxHash:
        'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
      toAddress: 'addr1wxaptpmxcxawvr3pzlhgnpmzz3ql43n2tc8mn3av5kx0yzs09tqh8',
      datum:
        'd8799f4100d8799fd8799fd8799fd8799f581c45560334095b9ea4a7e6810fdaca8500b083067b9db8c40a23367a59ffd8799fd8799fd8799f581caa1c8af933d8ffe326fd611720d20a047837a20bccf424059f5f58a5ffffffffd87a80ffd87a80ff1a002625a0d8799fd879801a0bebc200d8799f1a0d259324ffffff',
      index: 0,
      lovelaceBalance: 204500000n,
      assetBalances: [
        {
          asset: Asset.fromId(
            '7de52b397c138e44fb6e61aaaeb26219a8059b1749b7c3bd87bd9488.524245525259'
          ),
          quantity: 1n,
        },
      ],
    } as Utxo,
    {
      forTxHash:
        'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
      toAddress:
        'addr1q9z4vqe5p9deaf98u6qslkk2s5qtpqcx0wwm33q2yvm85kd2rj90jv7cll3jdltpzusdyzsy0qm6yz7v7sjqt86ltzjsxyskjg',
      datum: undefined,
      index: 1,
      lovelaceBalance: 1387846087n,
      assetBalances: [],
    } as Utxo,
  ],
  fee: 0n,
  mints: [],
  datums: {},
  redeemers: [],
};

const SUNDAESWAP_DEPOSIT_TX: Transaction = {
  hash: 'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
  blockHash: '3eac1a7e6bf815e62109019bc933e197eef28d953ccce2b5e092ebee1afedb98',
  blockSlot: 54902346,
  inputs: [],
  outputs: [
    {
      forTxHash:
        'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
      toAddress: 'addr1wxaptpmxcxawvr3pzlhgnpmzz3ql43n2tc8mn3av5kx0yzs09tqh8',
      datum:
        'd8799f4100d8799fd8799fd8799fd8799f581ca8c249d963489f861346f00670afff38bda116fff0ed2cfa9099884dffd8799fd8799fd8799f581c043f9cf37cdfeac72a0ab27399e60da0c6dce6df170def1cf5761292ffffffffd87a80ffd87a80ff1a002625a0d87b9fd87a9fd8799f1a060454381a0909680bffffffff',
      index: 0,
      lovelaceBalance: 204500000n,
      assetBalances: [
        {
          asset: Asset.fromId(
            '7de52b397c138e44fb6e61aaaeb26219a8059b1749b7c3bd87bd9488.524245525259'
          ),
          quantity: 1n,
        },
        {
          asset: Asset.fromId(
            '7de52b397c138e44fb6e61aaaeb26219a8059b1749b7c3bd87bd9488.534245525259'
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
};

const SUNDAESWAP_WITHDRAW_TX: Transaction = {
  hash: 'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
  blockHash: '3eac1a7e6bf815e62109019bc933e197eef28d953ccce2b5e092ebee1afedb98',
  blockSlot: 54902346,
  inputs: [],
  outputs: [
    {
      forTxHash:
        'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
      toAddress: 'addr1wxaptpmxcxawvr3pzlhgnpmzz3ql43n2tc8mn3av5kx0yzs09tqh8',
      datum:
        'd8799f4100d8799fd8799fd8799fd8799f581ca8c249d963489f861346f00670afff38bda116fff0ed2cfa9099884dffd8799fd8799fd8799f581c043f9cf37cdfeac72a0ab27399e60da0c6dce6df170def1cf5761292ffffffffd87a80ffd87a80ff1a002625a0d87a9f1a49bce48affff',
      index: 0,
      lovelaceBalance: 4500000n,
      assetBalances: [
        {
          asset: Asset.fromId(
            '0029cb7c88c7567b63d1a512c0ed626aa169688ec980730c0473b913.6c702000'
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
};

const SUNDAESWAP_LP_STATE_TX: Transaction = {
  hash: 'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
  blockHash: '3eac1a7e6bf815e62109019bc933e197eef28d953ccce2b5e092ebee1afedb98',
  blockSlot: 54902346,
  inputs: [],
  outputs: [
    {
      forTxHash:
        'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
      toAddress: 'addr1w9qzpelu9hn45pefc0xr4ac4kdxeswq7pndul2vuj59u8tqaxdznu',
      datum:
        'd8799fd8799fd8799f581c7de52b397c138e44fb6e61aaaeb26219a8059b1749b7c3bd87bd948846524245525259ffd8799f581c7de52b397c138e44fb6e61aaaeb26219a8059b1749b7c3bd87bd948846534245525259ffff41001b0000000297a61cc8d8799f011864ffff',
      index: 0,
      lovelaceBalance: 4500000n,
      assetBalances: [
        {
          asset: Asset.fromId(
            '7de52b397c138e44fb6e61aaaeb26219a8059b1749b7c3bd87bd9488.524245525259'
          ),
          quantity: 1n,
        },
        {
          asset: Asset.fromId(
            '7de52b397c138e44fb6e61aaaeb26219a8059b1749b7c3bd87bd9488.534245525259'
          ),
          quantity: 1n,
        },
        {
          asset: Asset.fromId(
            '0029cb7c88c7567b63d1a512c0ed626aa169688ec980730c0473b913.702000'
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
};

/**
 * Minswap
 */
const MINSWAP_SWAP_TX: Transaction = {
  hash: 'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
  blockHash: '3eac1a7e6bf815e62109019bc933e197eef28d953ccce2b5e092ebee1afedb98',
  blockSlot: 54902346,
  inputs: [],
  outputs: [
    {
      forTxHash:
        'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
      toAddress:
        'addr1zxn9efv2f6w82hagxqtn62ju4m293tqvw0uhmdl64ch8uw6j2c79gy9l76sdg0xwhd7r0c0kna0tycz4y5s6mlenh8pq6s3z70',
      datum:
        'd8799fd8799fd8799f581c9c8cc3ac2810e440ae1d0d41c4d7cbf79b860b5f315f8d4ed8350d81ffd8799fd8799fd8799f581c9c68111e7899b27497c7d97964488aaa9fe55370d2c5f2d68093e338ffffffffd8799fd8799f581c9c8cc3ac2810e440ae1d0d41c4d7cbf79b860b5f315f8d4ed8350d81ffd8799fd8799fd8799f581c9c68111e7899b27497c7d97964488aaa9fe55370d2c5f2d68093e338ffffffffd87a80d8799fd8799f581cf66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b698804469555344ff1a50956b2aff1a001e84801a001e8480ff',
      index: 0,
      lovelaceBalance: 3004000000n,
      assetBalances: [],
    } as Utxo,
  ],
  fee: 0n,
  mints: [],
  datums: {},
  redeemers: [],
};

const MINSWAP_DEPOSIT_TX: Transaction = {
  hash: 'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
  blockHash: '3eac1a7e6bf815e62109019bc933e197eef28d953ccce2b5e092ebee1afedb98',
  blockSlot: 54902346,
  inputs: [],
  outputs: [
    {
      forTxHash:
        'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
      toAddress:
        'addr1zxn9efv2f6w82hagxqtn62ju4m293tqvw0uhmdl64ch8uw6j2c79gy9l76sdg0xwhd7r0c0kna0tycz4y5s6mlenh8pq6s3z70',
      datum:
        'd8799fd8799fd8799f581c9c8cc3ac2810e440ae1d0d41c4d7cbf79b860b5f315f8d4ed8350d81ffd8799fd8799fd8799f581c9c68111e7899b27497c7d97964488aaa9fe55370d2c5f2d68093e338ffffffffd8799fd8799f581c9c8cc3ac2810e440ae1d0d41c4d7cbf79b860b5f315f8d4ed8350d81ffd8799fd8799fd8799f581c9c68111e7899b27497c7d97964488aaa9fe55370d2c5f2d68093e338ffffffffd87a80d87b9f01ff1a001e84801a001e8480ff',
      index: 0,
      lovelaceBalance: 3004000000n,
      assetBalances: [
        {
          asset: Asset.fromId(
            '7ab95d389c9237edfb0305fc889825ea4221e82a78446b3c78c0d5b6.434e43416c61'
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
};

const MINSWAP_WITHDRAW_TX: Transaction = {
  hash: 'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
  blockHash: '3eac1a7e6bf815e62109019bc933e197eef28d953ccce2b5e092ebee1afedb98',
  blockSlot: 54902346,
  inputs: [],
  outputs: [
    {
      forTxHash:
        'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
      toAddress:
        'addr1zxn9efv2f6w82hagxqtn62ju4m293tqvw0uhmdl64ch8uw6j2c79gy9l76sdg0xwhd7r0c0kna0tycz4y5s6mlenh8pq6s3z70',
      datum:
        'd8799fd8799fd8799f581c9c8cc3ac2810e440ae1d0d41c4d7cbf79b860b5f315f8d4ed8350d81ffd8799fd8799fd8799f581c9c68111e7899b27497c7d97964488aaa9fe55370d2c5f2d68093e338ffffffffd8799fd8799f581c9c8cc3ac2810e440ae1d0d41c4d7cbf79b860b5f315f8d4ed8350d81ffd8799fd8799fd8799f581c9c68111e7899b27497c7d97964488aaa9fe55370d2c5f2d68093e338ffffffffd87a80d87c9f1a0082e609190957ff1a001e84801a001e8480ff',
      index: 0,
      lovelaceBalance: 4000000n,
      assetBalances: [
        {
          asset: Asset.fromId(
            'e4214b7cce62ac6fbba385d164df48e157eae5863521b4b67ca71d86.a96ab397dac82b517d57aff799d5a78c0324db7c2c25feec6caf072d58eede64'
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
};

const MINSWAP_LP_STATE_TX: Transaction = {
  hash: 'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
  blockHash: '3eac1a7e6bf815e62109019bc933e197eef28d953ccce2b5e092ebee1afedb98',
  blockSlot: 54902346,
  inputs: [],
  outputs: [
    {
      forTxHash:
        'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
      toAddress:
        'addr1z8snz7c4974vzdpxu65ruphl3zjdvtxw8strf2c2tmqnxz2j2c79gy9l76sdg0xwhd7r0c0kna0tycz4y5s6mlenh8pq0xmsha',
      datum:
        'd8799fd8799f4040ffd8799f581c7ab95d389c9237edfb0305fc889825ea4221e82a78446b3c78c0d5b646434e43416c61ff1a000e8b861a000f34b5d8799fd8799fd8799fd8799f581caafb1196434cb837fd6f21323ca37b302dff6387e8a84b3fa28faf56ffd8799fd8799fd8799f581c52563c5410bff6a0d43ccebb7c37e1f69f5eb260552521adff33b9c2ffffffffd87a80ffffff',
      index: 0,
      lovelaceBalance: 3004000000n,
      assetBalances: [
        {
          asset: Asset.fromId(
            '13aa2accf2e1561723aa26871e071fdf32c867cff7e7d50ad470d62f.4d494e53574150'
          ),
          quantity: 1n,
        },
        {
          asset: Asset.fromId(
            '7ab95d389c9237edfb0305fc889825ea4221e82a78446b3c78c0d5b6.434e43416c61'
          ),
          quantity: 1n,
        },
        {
          asset: Asset.fromId(
            'e4214b7cce62ac6fbba385d164df48e157eae5863521b4b67ca71d86.a96ab397dac82b517d57aff799d5a78c0324db7c2c25feec6caf072d58eede64'
          ),
          quantity: 1n,
        },
        {
          asset: Asset.fromId(
            '0be55d262b29f564998ff81efe21bdc0022621c12f15af08d0f2ddb1.a96ab397dac82b517d57aff799d5a78c0324db7c2c25feec6caf072d58eede64'
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
};

/**
 * Wingriders
 */
const WINGRIDERS_SWAP_TX: Transaction = {
  hash: 'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
  blockHash: '3eac1a7e6bf815e62109019bc933e197eef28d953ccce2b5e092ebee1afedb98',
  blockSlot: 54902346,
  inputs: [],
  outputs: [
    {
      forTxHash:
        'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
      toAddress: 'addr1wxr2a8htmzuhj39y2gq7ftkpxv98y2g67tg8zezthgq4jkg0a4ul4',
      datum:
        'd8799fd8799fd8799fd8799f581c04d207719aa491f8c70c7398df55fc84a4078ddbdd87d9e9797f7494ffd8799fd8799fd8799f581c9c68111e7899b27497c7d97964488aaa9fe55370d2c5f2d68093e338ffffffff581c04d207719aa491f8c70c7398df55fc84a4078ddbdd87d9e9797f74941b00000187bfcd439ed8799fd8799f4040ffd8799f581cf66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b698804469555344ffffffd8799fd879801a100b8fe9ffff',
      index: 0,
      lovelaceBalance: 4000000n,
      assetBalances: [],
    } as Utxo,
  ],
  fee: 0n,
  mints: [],
  datums: {},
  redeemers: [],
};

const WINGRIDERS_DEPOSIT_TX: Transaction = {
  hash: 'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
  blockHash: '3eac1a7e6bf815e62109019bc933e197eef28d953ccce2b5e092ebee1afedb98',
  blockSlot: 54902346,
  inputs: [],
  outputs: [
    {
      forTxHash:
        'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
      toAddress: 'addr1wxr2a8htmzuhj39y2gq7ftkpxv98y2g67tg8zezthgq4jkg0a4ul4',
      datum:
        'd8799fd8799fd8799fd8799f581c9c8cc3ac2810e440ae1d0d41c4d7cbf79b860b5f315f8d4ed8350d81ffd8799fd8799fd8799f581c9c68111e7899b27497c7d97964488aaa9fe55370d2c5f2d68093e338ffffffff581c9c8cc3ac2810e440ae1d0d41c4d7cbf79b860b5f315f8d4ed8350d811b00000189e6ee04f9d8799fd8799f4040ffd8799f581c533bb94a8850ee3ccbe483106489399112b74c905342cb1792a797a044494e4459ffffffd87a9f181cffff',
      index: 0,
      lovelaceBalance: 4000000n,
      assetBalances: [
        {
          asset: Asset.fromId(
            '0be55d262b29f564998ff81efe21bdc0022621c12f15af08d0f2ddb1.a96ab397dac82b517d57aff799d5a78c0324db7c2c25feec6caf072d58eede64'
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
};

const WINGRIDERS_WITHDRAW_TX: Transaction = {
  hash: 'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
  blockHash: '3eac1a7e6bf815e62109019bc933e197eef28d953ccce2b5e092ebee1afedb98',
  blockSlot: 54902346,
  inputs: [],
  outputs: [
    {
      forTxHash:
        'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
      toAddress: 'addr1wxr2a8htmzuhj39y2gq7ftkpxv98y2g67tg8zezthgq4jkg0a4ul4',
      datum:
        'd8799fd8799fd8799fd8799f581c9c8cc3ac2810e440ae1d0d41c4d7cbf79b860b5f315f8d4ed8350d81ffd8799fd8799fd8799f581c9c68111e7899b27497c7d97964488aaa9fe55370d2c5f2d68093e338ffffffff581c9c8cc3ac2810e440ae1d0d41c4d7cbf79b860b5f315f8d4ed8350d811b00000189e6fcbab2d8799fd8799f4040ffd8799f581c533bb94a8850ee3ccbe483106489399112b74c905342cb1792a797a044494e4459ffffffd87b9f1902d0184fffff',
      index: 0,
      lovelaceBalance: 4000000n,
      assetBalances: [
        {
          asset: Asset.fromId(
            '026a18d04a0c642759bb3d83b12e3344894e5c1c7b2aeb1a2113a570.9b65707373c4cec488b16151a64d7102dbae16857c500652b5c513650b8d604e'
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
};

const WINGRIDERS_LP_STATE_TX: Transaction = {
  hash: 'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
  blockHash: '3eac1a7e6bf815e62109019bc933e197eef28d953ccce2b5e092ebee1afedb98',
  blockSlot: 54902346,
  inputs: [],
  outputs: [
    {
      forTxHash:
        'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
      toAddress:
        'addr1z8nvjzjeydcn4atcd93aac8allvrpjn7pjr2qsweukpnayv4uuuctkmfnszaeqv30txrfxxzssrdsd20vv6afc8pgxfszanerm',
      datum:
        'd8799f581c86ae9eebd8b97944a45201e4aec1330a72291af2d071644bba015959d8799fd8799fd8799f4040ffd8799f581c533bb94a8850ee3ccbe483106489399112b74c905342cb1792a797a044494e4459ffff1b00000189e5b504a81a0c06fac81a01778076ffff',
      index: 0,
      lovelaceBalance: 4000000n,
      assetBalances: [
        {
          asset: Asset.fromId(
            '026a18d04a0c642759bb3d83b12e3344894e5c1c7b2aeb1a2113a570.4c'
          ),
          quantity: 1n,
        },
        {
          asset: Asset.fromId(
            '026a18d04a0c642759bb3d83b12e3344894e5c1c7b2aeb1a2113a570.9b65707373c4cec488b16151a64d7102dbae16857c500652b5c513650b8d604e'
          ),
          quantity: 1n,
        },
        {
          asset: Asset.fromId(
            '533bb94a8850ee3ccbe483106489399112b74c905342cb1792a797a0.494e4459'
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
};

/**
 * Spectrum
 */
const SPECTRUM_SWAP_TX: Transaction = {
  hash: 'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
  blockHash: '3eac1a7e6bf815e62109019bc933e197eef28d953ccce2b5e092ebee1afedb98',
  blockSlot: 54902346,
  inputs: [],
  outputs: [
    {
      forTxHash:
        'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
      toAddress: 'addr1wynp362vmvr8jtc946d3a3utqgclfdl5y9d3kn849e359hsskr20n',
      datum:
        'd8799fd8799f4040ffd8799f581c533bb94a8850ee3ccbe483106489399112b74c905342cb1792a797a044494e4459ffd8799f581cd0861c6a8e913001a9ceaca2c8f3d403c7ed541e27fab570c0d17a324c494e44495f4144415f4e4654ff1903e51b001c15c1d90f1a361b00038d7ea4c68000581c9c8cc3ac2810e440ae1d0d41c4d7cbf79b860b5f315f8d4ed8350d81d8799f581c9c68111e7899b27497c7d97964488aaa9fe55370d2c5f2d68093e338ff1a000f42401a0002e534ff',
      index: 0,
      lovelaceBalance: 40000000n,
      assetBalances: [],
    } as Utxo,
  ],
  fee: 0n,
  mints: [],
  datums: {},
  redeemers: [],
};

const SPECTRUM_DEPOSIT_TX: Transaction = {
  hash: 'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
  blockHash: '3eac1a7e6bf815e62109019bc933e197eef28d953ccce2b5e092ebee1afedb98',
  blockSlot: 54902346,
  inputs: [],
  outputs: [
    {
      forTxHash:
        'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
      toAddress: 'addr1wyr4uz0tp75fu8wrg6gm83t20aphuc9vt6n8kvu09ctkugqpsrmeh',
      datum:
        'd8799fd8799f581cd0861c6a8e913001a9ceaca2c8f3d403c7ed541e27fab570c0d17a324c494e44495f4144415f4e4654ffd8799f4040ffd8799f581c533bb94a8850ee3ccbe483106489399112b74c905342cb1792a797a044494e4459ffd8799f581c23964d1dc94a7df2fd0e927ec1a9897166fbeca40596174363f7855e4b494e44495f4144415f4c51ff1a0016e360581c9c8cc3ac2810e440ae1d0d41c4d7cbf79b860b5f315f8d4ed8350d81d8799f581c9c68111e7899b27497c7d97964488aaa9fe55370d2c5f2d68093e338ff1a0014e9d4ff',
      index: 0,
      lovelaceBalance: 40000000n,
      assetBalances: [
        {
          asset: Asset.fromId(
            '533bb94a8850ee3ccbe483106489399112b74c905342cb1792a797a0.494e4459'
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
};

const SPECTRUM_WITHDRAW_TX: Transaction = {
  hash: 'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
  blockHash: '3eac1a7e6bf815e62109019bc933e197eef28d953ccce2b5e092ebee1afedb98',
  blockSlot: 54902346,
  inputs: [],
  outputs: [
    {
      forTxHash:
        'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
      toAddress: 'addr1wxpa5704x8qel88ympf4natfdzn59nc9esj7609y3sczmmsasees8',
      datum:
        'd8799fd8799f581cd0861c6a8e913001a9ceaca2c8f3d403c7ed541e27fab570c0d17a324c494e44495f4144415f4e4654ffd8799f4040ffd8799f581c533bb94a8850ee3ccbe483106489399112b74c905342cb1792a797a044494e4459ffd8799f581c23964d1dc94a7df2fd0e927ec1a9897166fbeca40596174363f7855e4b494e44495f4144415f4c51ff1a0016e360581c9c8cc3ac2810e440ae1d0d41c4d7cbf79b860b5f315f8d4ed8350d81d8799f581c9c68111e7899b27497c7d97964488aaa9fe55370d2c5f2d68093e338ffff',
      index: 0,
      lovelaceBalance: 40000000n,
      assetBalances: [
        {
          asset: Asset.fromId(
            '23964d1dc94a7df2fd0e927ec1a9897166fbeca40596174363f7855e.494e44495f4144415f4c51'
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
};

const SPECTRUM_LP_STATE_TX: Transaction = {
  hash: 'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
  blockHash: '3eac1a7e6bf815e62109019bc933e197eef28d953ccce2b5e092ebee1afedb98',
  blockSlot: 54902346,
  inputs: [],
  outputs: [
    {
      forTxHash:
        'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
      toAddress:
        'addr1x8nz307k3sr60gu0e47cmajssy4fmld7u493a4xztjrll0aj764lvrxdayh2ux30fl0ktuh27csgmpevdu89jlxppvrswgxsta',
      datum:
        'd8799fd8799f581cd0861c6a8e913001a9ceaca2c8f3d403c7ed541e27fab570c0d17a324c494e44495f4144415f4e4654ffd8799f4040ffd8799f581c533bb94a8850ee3ccbe483106489399112b74c905342cb1792a797a044494e4459ffd8799f581c23964d1dc94a7df2fd0e927ec1a9897166fbeca40596174363f7855e4b494e44495f4144415f4c51ff1903e59f581cc040e87e74cbf98ef42ba228b2f6890d91d70c6ea9cc318067b95e68ff1b00000004a817c800ff',
      index: 0,
      lovelaceBalance: 40000000n,
      assetBalances: [
        {
          asset: Asset.fromId(
            '23964d1dc94a7df2fd0e927ec1a9897166fbeca40596174363f7855e.494e44495f4144415f4c51'
          ),
          quantity: 1n,
        },
        {
          asset: Asset.fromId(
            '533bb94a8850ee3ccbe483106489399112b74c905342cb1792a797a0.494e4459'
          ),
          quantity: 1n,
        },
        {
          asset: Asset.fromId(
            'd0861c6a8e913001a9ceaca2c8f3d403c7ed541e27fab570c0d17a32.494e44495f4144415f4e4654'
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
};

/**
 * TeddySwap
 */
const TEDDYSWAP_SWAP_TX: Transaction = {
  hash: 'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
  blockHash: '3eac1a7e6bf815e62109019bc933e197eef28d953ccce2b5e092ebee1afedb98',
  blockSlot: 54902346,
  inputs: [],
  outputs: [
    {
      forTxHash:
        'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
      toAddress:
        'addr1z99tz7hungv6furtdl3zn72sree86wtghlcr4jc637r2eadkp2avt5gp297dnxhxcmy6kkptepsr5pa409qa7gf8stzs0706a3',
      datum:
        'd8799fd8799f4040ffd8799f581c533bb94a8850ee3ccbe483106489399112b74c905342cb1792a797a044494e4459ffd8799f581ced3ea3cc3efda14d48d969e57ec22e2b3e5803ed4887c1152c48637c56494e44595f4144415f504f4f4c5f4944454e54495459ff1903e81b001c4ca92253d5181b00038d7ea4c68000581c9c8cc3ac2810e440ae1d0d41c4d7cbf79b860b5f315f8d4ed8350d81d8799f581c9c68111e7899b27497c7d97964488aaa9fe55370d2c5f2d68093e338ff1a000f42421a000372b4ff',
      index: 0,
      lovelaceBalance: 40000000n,
      assetBalances: [],
    } as Utxo,
  ],
  fee: 0n,
  mints: [],
  datums: {},
  redeemers: [],
};

const TEDDYSWAP_DEPOSIT_TX: Transaction = {
  hash: 'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
  blockHash: '3eac1a7e6bf815e62109019bc933e197eef28d953ccce2b5e092ebee1afedb98',
  blockSlot: 54902346,
  inputs: [],
  outputs: [
    {
      forTxHash:
        'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
      toAddress:
        'addr1zyx8pkqywyu3qd2x7rnk4tlvlhcxvl9m897gjah5pt50evakp2avt5gp297dnxhxcmy6kkptepsr5pa409qa7gf8stzs6z6f9z',
      datum:
        'd8799fd8799f581cd0861c6a8e913001a9ceaca2c8f3d403c7ed541e27fab570c0d17a324c494e44495f4144415f4e4654ffd8799f4040ffd8799f581c533bb94a8850ee3ccbe483106489399112b74c905342cb1792a797a044494e4459ffd8799f581c23964d1dc94a7df2fd0e927ec1a9897166fbeca40596174363f7855e4b494e44495f4144415f4c51ff1a0016e360581c9c8cc3ac2810e440ae1d0d41c4d7cbf79b860b5f315f8d4ed8350d81d8799f581c9c68111e7899b27497c7d97964488aaa9fe55370d2c5f2d68093e338ff1a0014e9d4ff',
      index: 0,
      lovelaceBalance: 40000000n,
      assetBalances: [
        {
          asset: Asset.fromId(
            '533bb94a8850ee3ccbe483106489399112b74c905342cb1792a797a0.494e4459'
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
};

const TEDDYSWAP_WITHDRAW_TX: Transaction = {
  hash: 'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
  blockHash: '3eac1a7e6bf815e62109019bc933e197eef28d953ccce2b5e092ebee1afedb98',
  blockSlot: 54902346,
  inputs: [],
  outputs: [
    {
      forTxHash:
        'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
      toAddress:
        'addr1zx4ktrt9k4chhurm6wc6ntfg6vwpswq3hwjqw6h2e607hr4kp2avt5gp297dnxhxcmy6kkptepsr5pa409qa7gf8stzs5z3nsm',
      datum:
        'd8799fd8799f581cd0861c6a8e913001a9ceaca2c8f3d403c7ed541e27fab570c0d17a324c494e44495f4144415f4e4654ffd8799f4040ffd8799f581c533bb94a8850ee3ccbe483106489399112b74c905342cb1792a797a044494e4459ffd8799f581c23964d1dc94a7df2fd0e927ec1a9897166fbeca40596174363f7855e4b494e44495f4144415f4c51ff1a0016e360581c9c8cc3ac2810e440ae1d0d41c4d7cbf79b860b5f315f8d4ed8350d81d8799f581c9c68111e7899b27497c7d97964488aaa9fe55370d2c5f2d68093e338ffff',
      index: 0,
      lovelaceBalance: 40000000n,
      assetBalances: [
        {
          asset: Asset.fromId(
            '23964d1dc94a7df2fd0e927ec1a9897166fbeca40596174363f7855e.494e44495f4144415f4c51'
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
};

const TEDDYSWAP_LP_STATE_TX: Transaction = {
  hash: 'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
  blockHash: '3eac1a7e6bf815e62109019bc933e197eef28d953ccce2b5e092ebee1afedb98',
  blockSlot: 54902346,
  inputs: [],
  outputs: [
    {
      forTxHash:
        'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
      toAddress:
        'addr1zy5th50h46anh3v7zdvh7ve6amac7k4h3mdfvt0p6czm8zphr7r6v67asj5jc5w5uapfapv0u9433m3v9aag9w46spaqc60ygw',
      datum:
        'd8799fd8799f581ced3ea3cc3efda14d48d969e57ec22e2b3e5803ed4887c1152c48637c56494e44595f4144415f504f4f4c5f4944454e54495459ffd8799f4040ffd8799f581c533bb94a8850ee3ccbe483106489399112b74c905342cb1792a797a044494e4459ffd8799f581ced3ea3cc3efda14d48d969e57ec22e2b3e5803ed4887c1152c48637c4b4144415f494e44595f4c50ff1903e59f581ce05e21c5afb6baa3232a71d35e08700535a45ff2fd94a1c812c3c587ff00ff',
      index: 0,
      lovelaceBalance: 40000000n,
      assetBalances: [
        {
          asset: Asset.fromId(
            'ed3ea3cc3efda14d48d969e57ec22e2b3e5803ed4887c1152c48637c.4144415f494e44595f4c50'
          ),
          quantity: 1n,
        },
        {
          asset: Asset.fromId(
            '533bb94a8850ee3ccbe483106489399112b74c905342cb1792a797a0.494e4459'
          ),
          quantity: 1n,
        },
        {
          asset: Asset.fromId(
            'ed3ea3cc3efda14d48d969e57ec22e2b3e5803ed4887c1152c48637c.494e44595f4144415f504f4f4c5f4944454e54495459'
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
};

/**
 * MuesliSwap
 */
const MUESLISWAP_SWAP_TX: Transaction = {
  hash: 'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
  blockHash: '3eac1a7e6bf815e62109019bc933e197eef28d953ccce2b5e092ebee1afedb98',
  blockSlot: 54902346,
  inputs: [],
  outputs: [
    {
      forTxHash:
        'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
      toAddress:
        'addr1zyq0kyrml023kwjk8zr86d5gaxrt5w8lxnah8r6m6s4jp4g3r6dxnzml343sx8jweqn4vn3fz2kj8kgu9czghx0jrsyqqktyhv',
      datum:
        'd8799fd8799fd8799fd8799f581c9c8cc3ac2810e440ae1d0d41c4d7cbf79b860b5f315f8d4ed8350d81ffd8799fd8799fd8799f581c9c68111e7899b27497c7d97964488aaa9fe55370d2c5f2d68093e338ffffffff4040581cf66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b69880446955534419abe2d87a801a00286f90ffff',
      index: 0,
      lovelaceBalance: 40000000n,
      assetBalances: [
        {
          asset: Asset.fromId(
            'f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b69880.69555344'
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
};

const MUESLISWAP_LP_STATE_TX: Transaction = {
  hash: 'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
  blockHash: '3eac1a7e6bf815e62109019bc933e197eef28d953ccce2b5e092ebee1afedb98',
  blockSlot: 54902346,
  inputs: [],
  outputs: [
    {
      forTxHash:
        'f76c8b04c7e98435ae312b4ea9453ac8256a59d472eb14e148737095583e23db',
      toAddress:
        'addr1z9cy2gmar6cpn8yymll93lnd7lw96f27kn2p3eq5d4tjr7xnh3gfhnqcwez2pzmr4tryugrr0uahuk49xqw7dc645chscql0d7',
      datum:
        'd8799fd8799f4040ffd8799f581cf66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b698804469555344ff1b00000033cf3b6699181eff',
      index: 0,
      lovelaceBalance: 40000000n,
      assetBalances: [
        {
          asset: Asset.fromId(
            'f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b69880.69555344'
          ),
          quantity: 1n,
        },
        {
          asset: Asset.fromId(
            'de9b756719341e79785aa13c164e7fe68c189ed04d61c9876b2fe53f.4d7565736c69537761705f414d4d'
          ),
          quantity: 1n,
        },
        {
          asset: Asset.fromId(
            '909133088303c49f3a30f1cc8ed553a73857a29779f6c6561cd8093f.b4bc66f4c84eb38b23b4429032f7bfb825a9504845c373a70684c18ef3706b21'
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
};

// Setup globals
const globals: any = {};

globals.app = app;

globals.SUNDAESWAP_SWAP_TX = SUNDAESWAP_SWAP_TX;
globals.SUNDAESWAP_DEPOSIT_TX = SUNDAESWAP_DEPOSIT_TX;
globals.SUNDAESWAP_WITHDRAW_TX = SUNDAESWAP_WITHDRAW_TX;
globals.SUNDAESWAP_LP_STATE_TX = SUNDAESWAP_LP_STATE_TX;

globals.MINSWAP_SWAP_TX = MINSWAP_SWAP_TX;
globals.MINSWAP_DEPOSIT_TX = MINSWAP_DEPOSIT_TX;
globals.MINSWAP_WITHDRAW_TX = MINSWAP_WITHDRAW_TX;
globals.MINSWAP_LP_STATE_TX = MINSWAP_LP_STATE_TX;

globals.WINGRIDERS_SWAP_TX = WINGRIDERS_SWAP_TX;
globals.WINGRIDERS_DEPOSIT_TX = WINGRIDERS_DEPOSIT_TX;
globals.WINGRIDERS_WITHDRAW_TX = WINGRIDERS_WITHDRAW_TX;
globals.WINGRIDERS_LP_STATE_TX = WINGRIDERS_LP_STATE_TX;

globals.SPECTRUM_SWAP_TX = SPECTRUM_SWAP_TX;
globals.SPECTRUM_DEPOSIT_TX = SPECTRUM_DEPOSIT_TX;
globals.SPECTRUM_WITHDRAW_TX = SPECTRUM_WITHDRAW_TX;
globals.SPECTRUM_LP_STATE_TX = SPECTRUM_LP_STATE_TX;

globals.TEDDYSWAP_SWAP_TX = TEDDYSWAP_SWAP_TX;
globals.TEDDYSWAP_DEPOSIT_TX = TEDDYSWAP_DEPOSIT_TX;
globals.TEDDYSWAP_WITHDRAW_TX = TEDDYSWAP_WITHDRAW_TX;
globals.TEDDYSWAP_LP_STATE_TX = TEDDYSWAP_LP_STATE_TX;

globals.MUESLISWAP_SWAP_TX = MUESLISWAP_SWAP_TX;
globals.MUESLISWAP_LP_STATE_TX = MUESLISWAP_LP_STATE_TX;

export { globals };
