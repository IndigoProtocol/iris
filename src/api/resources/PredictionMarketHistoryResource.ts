import { BaseEntityResource } from './BaseEntityResource';
import { PredictionMarketHistory } from '../../db/entities/PredictionMarketHistory';

export class PredictionMarketHistoryResource extends BaseEntityResource {

    toJson(entity: PredictionMarketHistory): Object {
        return {
            uuid: entity.uuid,
            slot: entity.slot,
            yesShares: entity.yesShares,
            noShares: entity.noShares,
            yesPrice: entity.yesPrice,
            noPrice: entity.noPrice,
        };
    }

    toCompressed(entity: PredictionMarketHistory): Object {
        return  {
            t: 'PredictionMarket',
        };
    }

}
