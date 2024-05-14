import { BaseEntity, Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { LiquidityPool } from './LiquidityPool';
import { Asset, Token } from './Asset';
import { Dex, SwapOrderType } from '../../constants';
import { OperationStatus } from './OperationStatus';
import { Transaction } from '../../types';

@Entity({ name: 'liquidity_pool_swaps' })
export class LiquidityPoolSwap extends BaseEntity {

    dex: Dex;
    liquidityPoolIdentifier: string | undefined;
    toAddress: string;
    transaction: Transaction | undefined;

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
    swapOutToken: Relation<Asset | undefined>;

    @Column()
    type: SwapOrderType;

    @Column({ type: 'bigint', unsigned: true })
    swapInAmount: number;

    @Column({ type: 'bigint', nullable: true, unsigned: true })
    minReceive: number | undefined;

    @Column({ type: 'bigint', nullable: true, unsigned: true })
    actualReceive: number | undefined;

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

    @OneToMany(() => OperationStatus, (status: OperationStatus) => status.operationId)
    @JoinColumn()
    statuses: Relation<OperationStatus[]>;

    static make(
        dex: Dex,
        liquidityPoolIdentifier: string | undefined,
        swapInToken: Token | undefined,
        swapOutToken: Token | undefined,
        swapInAmount: number,
        minReceive: number,
        dexFeesPaid: number,
        senderPubKeyHash: string,
        senderStakeKeyHash: string,
        slot: number,
        txHash: string,
        outputIndex: number,
        toAddress: string,
        type: SwapOrderType = SwapOrderType.Instant,
        transaction?: Transaction,
    ): LiquidityPoolSwap {
        let instance: LiquidityPoolSwap = new LiquidityPoolSwap();

        instance.dex = dex;
        instance.liquidityPoolIdentifier = liquidityPoolIdentifier;
        instance.swapInToken = swapInToken === 'lovelace' ? undefined : swapInToken;
        instance.swapOutToken = swapOutToken === 'lovelace' ? undefined : swapOutToken;
        instance.type = type;
        instance.swapInAmount = swapInAmount;
        instance.minReceive = minReceive;
        instance.dexFeesPaid = dexFeesPaid;
        instance.senderPubKeyHash = senderPubKeyHash;
        instance.senderStakeKeyHash = senderStakeKeyHash;
        instance.slot = slot;
        instance.txHash = txHash;
        instance.outputIndex = outputIndex;
        instance.toAddress = toAddress;
        instance.transaction = transaction;

        return instance;
    }

}
