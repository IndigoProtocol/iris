import { BaseEntity, Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { LiquidityPool } from './LiquidityPool';
import { Asset } from './Asset';
import { Dex } from '../../constants';
import { OperationStatus } from './OperationStatus';
import { Transaction } from '../../types';

@Entity({ name: 'liquidity_pool_withdraws' })
export class LiquidityPoolWithdraw extends BaseEntity {

    dex: Dex;
    liquidityPoolIdentifier: string | undefined;
    transaction: Transaction | undefined;
    backupDex: string;

    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => LiquidityPool)
    @JoinColumn()
    liquidityPool: Relation<LiquidityPool | undefined>;

    @OneToOne(() => Asset)
    @JoinColumn()
    lpToken: Relation<Asset>;

    @Column({ type: 'bigint', unsigned: true })
    lpTokenAmount: number;

    @Column({ type: 'bigint', nullable: true, unsigned: true })
    minReceiveA: number | undefined;

    @Column({ type: 'bigint', nullable: true, unsigned: true })
    minReceiveB: number | undefined;

    @Column({ type: 'varchar' })
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
    statuses: OperationStatus[];

    static make(
        dex: Dex,
        liquidityPoolIdentifier: string | undefined,
        lpToken: Asset,
        lpTokenAmount: number,
        minReceiveA: number | undefined,
        minReceiveB: number | undefined,
        dexFeesPaid: number,
        senderPubKeyHash: string,
        senderStakeKeyHash: string,
        slot: number,
        txHash: string,
        outputIndex: number,
        transaction?: Transaction,
        backupDex: string = '',
    ): LiquidityPoolWithdraw {
        let instance: LiquidityPoolWithdraw = new LiquidityPoolWithdraw();

        instance.dex = dex;
        instance.liquidityPoolIdentifier = liquidityPoolIdentifier;
        instance.lpToken = lpToken;
        instance.lpTokenAmount = lpTokenAmount;
        instance.minReceiveA = minReceiveA ? minReceiveA : undefined;
        instance.minReceiveB = minReceiveB ? minReceiveB : undefined;
        instance.dexFeesPaid = dexFeesPaid;
        instance.senderPubKeyHash = senderPubKeyHash;
        instance.senderStakeKeyHash = senderStakeKeyHash;
        instance.slot = slot;
        instance.txHash = txHash;
        instance.outputIndex = outputIndex;
        instance.transaction = transaction;
        instance.backupDex = backupDex;

        return instance;
    }

}
