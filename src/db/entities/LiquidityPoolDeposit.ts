import { BaseEntity, Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { LiquidityPool } from './LiquidityPool';
import { Asset, Token } from './Asset';
import { Dex } from '../../constants';
import { OperationStatus } from './OperationStatus';

@Entity({ name: 'liquidity_pool_deposits' })
export class LiquidityPoolDeposit extends BaseEntity {

    dex: Dex;
    liquidityPoolIdentifier: string | undefined;

    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => LiquidityPool)
    @JoinColumn()
    liquidityPool: Relation<LiquidityPool | undefined>;

    @OneToOne(() => Asset, { nullable: true })
    @JoinColumn()
    depositAToken: Relation<Asset | undefined>;

    @OneToOne(() => Asset, { nullable: true })
    @JoinColumn()
    depositBToken: Relation<Asset | undefined>;

    @Column({ type: 'bigint', unsigned: true })
    depositAAmount: number;

    @Column({ type: 'bigint', unsigned: true })
    depositBAmount: number;

    @Column({ type: 'bigint', nullable: true, unsigned: true })
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

    @OneToMany(() => OperationStatus, (status: OperationStatus) => status.operationId)
    @JoinColumn()
    statuses: OperationStatus[];

    static make(
        dex: Dex,
        liquidityPoolIdentifier: string | undefined,
        depositAToken: Token | undefined,
        depositBToken: Token | undefined,
        depositAAmount: number,
        depositBAmount: number,
        minLpTokenReceive: number | undefined,
        dexFeesPaid: number,
        senderPubKeyHash: string,
        senderStakeKeyHash: string,
        slot: number,
        txHash: string,
        outputIndex: number,
    ): LiquidityPoolDeposit {
        let instance: LiquidityPoolDeposit = new LiquidityPoolDeposit();

        instance.dex = dex;
        instance.liquidityPoolIdentifier = liquidityPoolIdentifier;
        instance.depositAToken = depositAToken === 'lovelace' ? undefined : depositAToken;
        instance.depositBToken = depositBToken === 'lovelace' ? undefined : depositBToken;
        instance.depositAAmount = depositAAmount;
        instance.depositBAmount = depositBAmount;
        instance.minLpTokenReceive = minLpTokenReceive ? minLpTokenReceive : undefined;
        instance.dexFeesPaid = dexFeesPaid;
        instance.senderPubKeyHash = senderPubKeyHash;
        instance.senderStakeKeyHash = senderStakeKeyHash;
        instance.slot = slot;
        instance.txHash = txHash;
        instance.outputIndex = outputIndex;

        return instance;
    }

}
