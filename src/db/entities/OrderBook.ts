import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { Asset } from './Asset';
import { Dex } from '../../constants';
import { tokenId } from '../../utils';

@Entity({ name: 'order_books' })
export class OrderBook extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  identifier: string;

  @Column()
  dex: string;

  @OneToOne(() => Asset, { nullable: true, eager: true })
  @JoinColumn()
  tokenA: Relation<Asset | undefined>;

  @OneToOne(() => Asset, { eager: true })
  @JoinColumn()
  tokenB: Relation<Asset>;

  @Column({ type: 'bigint', unsigned: true })
  createdSlot: number;

  static make(
    dex: Dex,
    tokenA: Asset | undefined,
    tokenB: Asset,
    createdSlot: number
  ): OrderBook {
    let book: OrderBook = new OrderBook();

    book.identifier = `${dex}.${tokenId(tokenA ?? 'lovelace')}.${tokenId(
      tokenB
    )}`;
    book.dex = dex;
    book.tokenA = tokenA;
    book.tokenB = tokenB;
    book.createdSlot = createdSlot;

    return book;
  }
}
