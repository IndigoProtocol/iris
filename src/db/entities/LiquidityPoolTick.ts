import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { LiquidityPool } from './LiquidityPool';

@Entity({ name: 'liquidity_pool_ticks' })
export class LiquidityPoolTick extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => LiquidityPool)
    @JoinColumn()
    liquidityPool: Relation<LiquidityPool>;

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
        liquidityPool: LiquidityPool,
        resolution: string,
        time: number,
        open: number,
        high: number,
        low: number,
        close: number,
        tvl: number = 0,
        volume: number = 0,
    ): LiquidityPoolTick {
        let instance: LiquidityPoolTick = new LiquidityPoolTick();

        instance.liquidityPool = liquidityPool;
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
