import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { PredictionMarket } from './PredictionMarket';

@Entity({ name: 'prediction_market_histories' })
export class PredictionMarketHistory extends BaseEntity {

    predictionMarketId: number;

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => PredictionMarket)
    @JoinColumn()
    predictionMarket: Relation<PredictionMarket>;

    @Column()
    uuid: string;

    @Column()
    slot: number;

    @Column()
    yesShares: number;

    @Column()
    noShares: number;

    @Column()
    yesPrice: number;

    @Column()
    noPrice: number;

    static make(
        uuid: string,
        predictionMarketId: number,
        slot: number,
        yesShares: number,
        noShares: number,
        yesPrice: number,
        noPrice: number,
    ): PredictionMarketHistory {
        let model: PredictionMarketHistory = new PredictionMarketHistory();

        model.uuid = uuid;
        model.predictionMarketId = predictionMarketId;
        model.slot = slot;
        model.yesShares = yesShares;
        model.noShares = noShares;
        model.yesPrice = yesPrice;
        model.noPrice = noPrice;

        return model;
    }

}
