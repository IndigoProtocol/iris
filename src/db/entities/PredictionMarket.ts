import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'prediction_markets' })
export class PredictionMarket extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    uuid: string;

    @Column()
    creatorPkh: string;

    @Column()
    creatorSkh: string;

    @Column()
    deadline: number;

    @Column()
    marketAssetPolicyId: string;

    @Column()
    marketAssetNameHex: string;

    @Column()
    positionPolicyId: string;

    @Column()
    positionYesNameHex: string;

    @Column()
    positionNoNameHex: string;

    static make(
        uuid: string,
        creatorPkh: string,
        creatorSkh: string,
        deadline: number,
        marketAssetPolicyId: string,
        marketAssetNameHex: string,
        positionPolicyId: string,
        positionYesNameHex: string,
        positionNoNameHex: string,
    ): PredictionMarket {
        let model: PredictionMarket = new PredictionMarket();

        model.uuid = uuid;
        model.creatorPkh = creatorPkh;
        model.creatorSkh = creatorSkh;
        model.deadline = deadline;
        model.marketAssetPolicyId = marketAssetPolicyId;
        model.marketAssetNameHex = marketAssetNameHex;
        model.positionPolicyId = positionPolicyId;
        model.positionYesNameHex = positionYesNameHex;
        model.positionNoNameHex = positionNoNameHex;

        return model;
    }

}
