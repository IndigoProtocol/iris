import { BaseEntityResource } from './BaseEntityResource';
import { LiquidityPool } from '../../db/entities/LiquidityPool';
import { AssetResource } from './AssetResource';
import { LiquidityPoolStateResource } from './LiquidityPoolStateResource';

export class LiquidityPoolResource extends BaseEntityResource {

    private _assetResource: AssetResource;
    private _stateResource: LiquidityPoolStateResource;

    constructor() {
        super();

        this._assetResource = new AssetResource();
        this._stateResource = new LiquidityPoolStateResource(false);
    }

    toJson(entity: LiquidityPool): Object {
        return {
            dex: entity.dex,
            identifier: entity.identifier,
            address: entity.address,
            tokenA: entity.tokenA ? this._assetResource.toJson(entity.tokenA) : null,
            tokenB: this._assetResource.toJson(entity.tokenB),
            createdSlot: entity.createdSlot,
            state: entity.latestState ? this._stateResource.toJson(entity.latestState) : null
        };
    }

    toCompressed(entity: LiquidityPool): Object {
        return  {
            t: 'LiquidityPool',
            d: entity.dex,
            i: entity.identifier,
            a: entity.address,
            tA: entity.tokenA ? this._assetResource.toCompressed(entity.tokenA) : null,
            tB: this._assetResource.toCompressed(entity.tokenB),
            cS: entity.createdSlot,
            s: entity.latestState ? this._stateResource.toCompressed(entity.latestState) : null
        };
    }

}
