import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'syncs' })
export class Sync extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    blockHash: string;

    @Column({ type: 'bigint', unsigned: true })
    slot: number;

    static make(
        blockHash: string,
        slot: number,
    ): Sync {
        let instance: Sync = new Sync();

        instance.id = 1;
        instance.blockHash = blockHash;
        instance.slot = slot;

        return instance;
    }

}
