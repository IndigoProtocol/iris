import { BaseEntityResource } from './BaseEntityResource';
import { LiquidityPoolTick } from '../../db/entities/LiquidityPoolTick';

export class LiquidityPoolTickResource extends BaseEntityResource {

    toJson(entity: LiquidityPoolTick): Object {
        return {
            open: entity.open,
            high: entity.high,
            low: entity.low,
            close: entity.close,
            volume: entity.volume,
            time: entity.time,
        };
    }

    toCompressed(entity: LiquidityPoolTick): Object {
        return {
            t: 'LiquidityPoolTick',
            r: entity.resolution,
            o: entity.open,
            h: entity.high,
            l: entity.low,
            c: entity.close,
            v: entity.volume,
            ti: entity.time,
        };
    }

}
