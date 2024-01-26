import { BaseEntityResource } from './BaseEntityResource';
import { Asset } from '../../db/entities/Asset';

export class AssetResource extends BaseEntityResource {

    toJson(entity: Asset): Object {
        let response: any = {
            policyId: entity.policyId,
            nameHex: entity.nameHex,
            decimals: entity.decimals,
            isLpToken: Boolean(entity.isLpToken),
        };

        if (! entity.isLpToken) {
            response.name = entity.name;
            response.ticker = entity.ticker;
            response.logo = entity.logo;
            response.description = entity.description;
            response.isVerified = entity.isVerified;
        }

        return response;
    }

    toCompressed(entity: Asset): Object {
        let response: any = {
            t: 'Asset',
            pId: entity.policyId,
            nH: entity.nameHex,
            d: entity.decimals,
            isLp: Boolean(entity.isLpToken),
        };

        if (! entity.isLpToken) {
            response.n = entity.name;
            response.ti = entity.ticker;
            response.l = entity.logo;
            response.de = entity.description;
            response.v = entity.isVerified;
        }

        return response;
    }

}
