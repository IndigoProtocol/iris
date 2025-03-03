import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { LiquidityPool } from './LiquidityPool';
import { Asset, Token } from './Asset';
import { Dex } from '../../constants';
import { OperationStatus } from './OperationStatus';
import { Transaction } from '../../types';

@Entity({ name: 'liquidity_pool_zaps' })
export class LiquidityPoolZap extends BaseEntity {
  dex: Dex;
  liquidityPoolIdentifier: string | undefined;
  transaction: Transaction | undefined;
  backupDex: string;

  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => LiquidityPool)
  @JoinColumn()
  liquidityPool: Relation<LiquidityPool | undefined>;

  @OneToOne(() => Asset, { nullable: true })
  @JoinColumn()
  swapInToken: Relation<Asset | undefined>;

  @OneToOne(() => Asset, { nullable: true })
  @JoinColumn()
  forToken: Relation<Asset | undefined>;

  @Column({ type: 'bigint', unsigned: true })
  swapInAmount: number;

  @Column({ type: 'bigint', unsigned: true })
  minLpTokenReceive: number | undefined;

  @Column({ type: 'bigint', unsigned: true })
  dexFeesPaid: number;

  @Column()
  senderPubKeyHash: string;

  @Column({ nullable: true })
  senderStakeKeyHash: string;

  @Column({ type: 'bigint', unsigned: true })
  slot: number;

  @Column()
  txHash: string;

  @Column()
  outputIndex: number;

  @Column({ nullable: true })
  meta: string;

  @OneToMany(
    () => OperationStatus,
    (status: OperationStatus) => status.operationId
  )
  @JoinColumn()
  statuses: Relation<OperationStatus>[];

  static make(
    dex: Dex,
    liquidityPoolIdentifier: string | undefined,
    swapInToken: Token | undefined,
    forToken: Token | undefined,
    swapInAmount: number,
    minLpTokenReceive: number | undefined,
    dexFeesPaid: number,
    senderPubKeyHash: string,
    senderStakeKeyHash: string,
    slot: number,
    txHash: string,
    outputIndex: number,
    transaction?: Transaction,
    backupDex: string = ''
  ): LiquidityPoolZap {
    let instance: LiquidityPoolZap = new LiquidityPoolZap();

    instance.dex = dex;
    instance.liquidityPoolIdentifier = liquidityPoolIdentifier;
    instance.swapInToken = swapInToken === 'lovelace' ? undefined : swapInToken;
    instance.forToken = forToken === 'lovelace' ? undefined : forToken;
    instance.swapInAmount = swapInAmount;
    instance.minLpTokenReceive = minLpTokenReceive;
    instance.dexFeesPaid = dexFeesPaid;
    instance.senderPubKeyHash = senderPubKeyHash;
    instance.senderStakeKeyHash = senderStakeKeyHash;
    instance.slot = slot;
    instance.txHash = txHash;
    instance.slot = slot;
    instance.txHash = txHash;
    instance.outputIndex = outputIndex;
    instance.transaction = transaction;
    instance.backupDex = backupDex;

    return instance;
  }
}
