import { BaseEntityResource } from './BaseEntityResource';
import { LiquidityPoolTick } from '../../db/entities/LiquidityPoolTick';
import {LiquidityPoolResource} from "./LiquidityPoolResource";

export class LiquidityPoolTickResource extends BaseEntityResource {

    toJson(entity: LiquidityPoolTick): Object {
        let response: any =  {
            resolution: entity.resolution,
            open: entity.open,
            high: entity.high,
            low: entity.low,
            close: entity.close,
            volume: entity.volume,
            time: entity.time,
        };

        if (entity.liquidityPool) {
            response.liquidityPool = (new LiquidityPoolResource()).toJson(entity.liquidityPool);
        }

        return response;
    }

    toCompressed(entity: LiquidityPoolTick): Object {
        let response: any =  {
            t: 'LiquidityPoolTick',
            r: entity.resolution,
            o: entity.open,
            h: entity.high,
            l: entity.low,
            c: entity.close,
            v: entity.volume,
            ti: entity.time,
        };

        if (entity.liquidityPool) {
            response.lP = (new LiquidityPoolResource()).toCompressed(entity.liquidityPool);
        }

        return response;
    }

}
