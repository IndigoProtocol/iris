import { BaseEntity, Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { Asset } from './Asset';
import { Dex } from '../../constants';
import { LiquidityPoolState } from './LiquidityPoolState';

@Entity({ name: 'liquidity_pools' })
export class LiquidityPool extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    dex: string;

    @Column({ unique: true })
    identifier: string;

    @Column()
    address: string;

    @OneToOne(() => Asset, { nullable: true, eager: true })
    @JoinColumn()
    tokenA: Relation<Asset | undefined>;

    @OneToOne(() => Asset, { eager: true })
    @JoinColumn()
    tokenB: Relation<Asset>;

    @Column({ type: 'bigint', unsigned: true })
    createdSlot: number;

    @OneToOne(() => LiquidityPoolState)
    @JoinColumn()
    latestState: Relation<LiquidityPoolState>;

    @OneToMany(() => LiquidityPoolState, (state: LiquidityPoolState) => state.liquidityPool)
    @JoinColumn()
    states: Relation<LiquidityPoolState>[];

    static make(
        dex: Dex,
        identifier: string,
        address: string,
        tokenA: Asset | undefined,
        tokenB: Asset,
        createdSlot: number,
    ): LiquidityPool {
        let pool: LiquidityPool = new LiquidityPool();

        pool.dex = dex;
        pool.identifier = identifier;
        pool.address = address;
        pool.tokenA = tokenA;
        pool.tokenB = tokenB;
        pool.createdSlot = createdSlot;

        return pool;
    }

}
