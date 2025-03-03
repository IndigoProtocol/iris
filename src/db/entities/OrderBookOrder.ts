import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { Asset, Token } from './Asset';
import { OrderBook } from './OrderBook';
import { Dex } from '../../constants';
import { Transaction } from '../../types';

@Entity({ name: 'order_book_orders' })
export class OrderBookOrder extends BaseEntity {
  dex: Dex;
  transaction: Transaction | undefined;

  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => OrderBook)
  @JoinColumn()
  orderBook: Relation<OrderBook | undefined>;

  @OneToOne(() => Asset, { nullable: true, eager: true })
  @JoinColumn()
  fromToken: Relation<Asset | undefined>;

  @OneToOne(() => Asset, { eager: true })
  @JoinColumn()
  toToken: Relation<Asset | undefined>;

  @Column({ nullable: true })
  identifier: string;

  @Column({ type: 'bigint', unsigned: true })
  originalOfferAmount: number;

  @Column({ type: 'bigint', unsigned: true })
  unFilledOfferAmount: number;

  @Column({ type: 'bigint', unsigned: true })
  askedAmount: number;

  @Column({ type: 'float', unsigned: true })
  price: number;

  @Column()
  numPartialFills: number;

  @Column()
  isCancelled: boolean;

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

  static make(
    dex: Dex,
    fromToken: Token,
    toToken: Token,
    identifier: string,
    originalOfferAmount: number,
    unFilledOfferAmount: number,
    askedAmount: number,
    price: number,
    numPartialFills: number,
    isCancelled: boolean,
    dexFeesPaid: number,
    senderPubKeyHash: string,
    senderStakeKeyHash: string,
    slot: number,
    txHash: string,
    outputIndex: number,
    transaction?: Transaction
  ): OrderBookOrder {
    let instance: OrderBookOrder = new OrderBookOrder();

    instance.dex = dex;
    instance.fromToken = fromToken === 'lovelace' ? undefined : fromToken;
    instance.toToken = toToken === 'lovelace' ? undefined : toToken;
    instance.identifier = identifier;
    instance.originalOfferAmount = originalOfferAmount;
    instance.unFilledOfferAmount = unFilledOfferAmount;
    instance.askedAmount = askedAmount;
    instance.price = price;
    instance.numPartialFills = numPartialFills;
    instance.isCancelled = isCancelled;
    instance.dexFeesPaid = dexFeesPaid;
    instance.senderPubKeyHash = senderPubKeyHash;
    instance.senderStakeKeyHash = senderStakeKeyHash;
    instance.slot = slot;
    instance.txHash = txHash;
    instance.outputIndex = outputIndex;
    instance.transaction = transaction;

    return instance;
  }
}
