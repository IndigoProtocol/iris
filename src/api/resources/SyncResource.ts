import { BaseEntityResource } from './BaseEntityResource';
import { Sync } from '../../db/entities/Sync';

export class SyncResource extends BaseEntityResource {
  toJson(entity: Sync): Object {
    return {
      slot: Number(entity.slot),
      blockHash: entity.blockHash,
    };
  }

  toCompressed(entity: Sync): Object {
    return {
      t: 'Sync',
      s: Number(entity.slot),
      bH: entity.blockHash,
    };
  }
}
