import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'liqwid_markets' })
export class LiqwidMarket extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    asset: string;

    @Column()
    slot: number;

    @Column()
    minSupply: number;

    @Column()
    minBatchTime: number;

    @Column()
    maxBatchTime: number;

    @Column()
    minBatchSize: number;

    @Column()
    interestUtilMultiplier: number;

    @Column()
    interestUtilMultiplierJump: number;

    @Column({ type: 'double', nullable: true })
    borrowCap: number | null;

    @Column({ type: 'double', nullable: true })
    supplyCap: number | null;

    static make(
        asset: string,
        slot: number,
        minSupply: number,
        minBatchTime: number,
        maxBatchTime: number,
        minBatchSize: number,
        interestUtilMultiplier: number,
        interestUtilMultiplierJump: number,
        borrowCap: number | null,
        supplyCap: number | null,
    ): LiqwidMarket {
        let model: LiqwidMarket = new LiqwidMarket();

        model.asset = asset;
        model.slot = slot;
        model.minSupply = minSupply;
        model.minBatchTime = minBatchTime;
        model.maxBatchTime = maxBatchTime;
        model.minBatchSize = minBatchSize;
        model.interestUtilMultiplier = interestUtilMultiplier;
        model.interestUtilMultiplierJump = interestUtilMultiplierJump;
        model.borrowCap = borrowCap;
        model.supplyCap = supplyCap;

        return model;
    }

}
