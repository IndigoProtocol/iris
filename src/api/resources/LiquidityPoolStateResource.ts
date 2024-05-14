import { BaseEntityResource } from './BaseEntityResource';
import { LiquidityPoolState } from '../../db/entities/LiquidityPoolState';
import { LiquidityPoolResource } from './LiquidityPoolResource';
import { AssetResource } from './AssetResource';

export class LiquidityPoolStateResource extends BaseEntityResource {

    private readonly _includePool: boolean;
    private _assetResource: AssetResource;
    private readonly _poolResource: LiquidityPoolResource | undefined = undefined;

    constructor(includePool: boolean = true) {
        super();

        this._includePool = includePool;
        this._assetResource = new AssetResource();

        if (this._includePool) {
            this._poolResource = new LiquidityPoolResource();
        }
    }

    toJson(entity: LiquidityPoolState): Object {
        let response: any = {
            reserveA: Number(entity.reserveA),
            reserveB: Number(entity.reserveB),
            lpTokens: Number(entity.lpTokens),
            tvl: Number(entity.tvl),
            feePercent: Number(entity.feePercent),
            slot: Number(entity.slot),
        };

        if (this._includePool && this._poolResource) {
            response.liquidityPool = entity.liquidityPool ? this._poolResource.toJson(entity.liquidityPool): null;
        }

        if (entity.tokenLp) {
            response.tokenLp = this._assetResource.toJson(entity.tokenLp);
        }

        return response;
    }

    toCompressed(entity: LiquidityPoolState): Object {
        let response: any = {
            t: 'LiquidityPoolState',
            rA: Number(entity.reserveA),
            rB: Number(entity.reserveB),
            lpTs: Number(entity.lpTokens),
            tvl: Number(entity.tvl),
            f: Number(entity.feePercent),
            s: Number(entity.slot),
        };

        if (this._includePool && this._poolResource) {
            response.p = entity.liquidityPool ? this._poolResource.toCompressed(entity.liquidityPool): null;
        }

        if (entity.tokenLp) {
            response.tLp = this._assetResource.toCompressed(entity.tokenLp);
        }

        return response;
    }

}
