import { BaseEntityResource } from './BaseEntityResource';
import { PredictionMarket } from '../../db/entities/PredictionMarket';

export class PredictionMarketResource extends BaseEntityResource {

    toJson(entity: PredictionMarket): Object {
        return {
            uuid: entity.uuid,
            creatorPkh: entity.creatorPkh,
            creatorSkh: entity.creatorSkh,
            deadline: entity.deadline,
            marketAssetPolicyId: entity.marketAssetPolicyId,
            marketAssetNameHex: entity.marketAssetNameHex,
            positionPolicyId: entity.positionPolicyId,
            positionYesNameHex: entity.positionYesNameHex,
            positionNoNameHex: entity.positionNoNameHex,
        };
    }

    toCompressed(entity: PredictionMarket): Object {
        return  {
            t: 'PredictionMarket',
        };
    }

}
