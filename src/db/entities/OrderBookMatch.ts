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
import { OrderBookOrder } from './OrderBookOrder';
import { Transaction } from '../../types';

@Entity({ name: 'order_book_matches' })
export class OrderBookMatch extends BaseEntity {
  dex: Dex;
  consumedTxHash: string;
  partialFillOrderIdentifier: string;
  transaction: Transaction | undefined;
  unFilledAmount: number;

  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => OrderBook)
  @JoinColumn()
  orderBook: Relation<OrderBook | undefined>;

  @OneToOne(() => OrderBookOrder, { nullable: false, eager: true })
  @JoinColumn()
  referenceOrder: Relation<OrderBookOrder>;

  @OneToOne(() => Asset, { eager: true })
  @JoinColumn()
  matchedToken: Relation<Asset | undefined>;

  @Column({ type: 'bigint', unsigned: true })
  matchedAmount: number;

  @Column()
  receiverPubKeyHash: string;

  @Column({ nullable: true })
  receiverStakeKeyHash: string;

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
    matchedToken: Token | undefined,
    matchedAmount: number,
    receiverPubKeyHash: string,
    receiverStakeKeyHash: string,
    slot: number,
    txHash: string,
    outputIndex: number,
    consumedTxHash: string,
    partialFillOrderIdentifier: string = '',
    referenceOrder: OrderBookOrder | undefined = undefined,
    transaction?: Transaction,
    unFilledAmount: number = 0
  ): OrderBookMatch {
    let instance: OrderBookMatch = new OrderBookMatch();

    instance.dex = dex;
    instance.matchedToken =
      matchedToken === 'lovelace' ? undefined : matchedToken;
    instance.matchedAmount = matchedAmount;
    instance.receiverPubKeyHash = receiverPubKeyHash;
    instance.receiverStakeKeyHash = receiverStakeKeyHash;
    instance.slot = slot;
    instance.txHash = txHash;
    instance.outputIndex = outputIndex;
    instance.consumedTxHash = consumedTxHash;
    instance.partialFillOrderIdentifier = partialFillOrderIdentifier;
    instance.transaction = transaction;
    instance.unFilledAmount = unFilledAmount;

    if (referenceOrder) {
      instance.referenceOrder = referenceOrder;
    }

    return instance;
  }
}
