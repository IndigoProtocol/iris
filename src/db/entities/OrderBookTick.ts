import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { OrderBook } from './OrderBook';

@Entity({ name: 'order_book_ticks' })
export class OrderBookTick extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => OrderBook)
  @JoinColumn()
  orderBook: Relation<OrderBook>;

  @Column()
  resolution: string;

  @Column()
  time: number;

  @Column({ type: 'double' })
  open: number;

  @Column({ type: 'double' })
  high: number;

  @Column({ type: 'double' })
  low: number;

  @Column({ type: 'double' })
  close: number;

  @Column({ type: 'double' })
  volume: number;

  @Column({ type: 'bigint', unsigned: true })
  tvl: number;

  static make(
    orderBook: OrderBook,
    resolution: string,
    time: number,
    open: number,
    high: number,
    low: number,
    close: number,
    tvl: number = 0,
    volume: number = 0
  ): OrderBookTick {
    let instance: OrderBookTick = new OrderBookTick();

    instance.orderBook = orderBook;
    instance.resolution = resolution;
    instance.time = time;
    instance.open = open;
    instance.high = high;
    instance.low = low;
    instance.close = close;
    instance.tvl = tvl;
    instance.volume = volume;

    return instance;
  }
}
