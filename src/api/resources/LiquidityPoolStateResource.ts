import { LiquidityPoolState } from '../../db/entities/LiquidityPoolState';
import { AssetResource } from './AssetResource';
import { BaseEntityResource } from './BaseEntityResource';
import { LiquidityPoolResource } from './LiquidityPoolResource';

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
      response.liquidityPool = entity.liquidityPool
        ? this._poolResource.toJson(entity.liquidityPool)
        : null;
    }

    if (entity.tokenLp) {
      response.tokenLp = this._assetResource.toJson(entity.tokenLp);
    }

    return response;
  }

  toJsonRedis(entity: LiquidityPoolState): {
    id: string;
    tokens: {
      id: string;
      name: string;
    }[];
    reserves: [string, string];
    source: string;
    sourceType: string;
    paused: boolean;
    blockHeight: number;
    updatedAt: number;
    extra: string;
  } {
    return {
      id: entity.liquidityPoolIdentifier,
      blockHeight: entity.slot,
      paused: false,
      updatedAt: Date.now(),
      reserves: [entity.reserveA, entity.reserveB],
      tokens: [
        {
          id: entity.tokenA?.policyId || '',
          name: entity.tokenA?.assetName || '',
        },
        {
          id: entity.tokenB.policyId,
          name: entity.tokenB.assetName,
        },
      ],
      source: entity.dex,
      sourceType: entity.dex,
      extra: JSON.stringify(entity.extra),
    };
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
      response.p = entity.liquidityPool
        ? this._poolResource.toCompressed(entity.liquidityPool)
        : null;
    }

    if (entity.tokenLp) {
      response.tLp = this._assetResource.toCompressed(entity.tokenLp);
    }

    return response;
  }
}
