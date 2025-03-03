import { BaseIndexer } from './BaseIndexer';
import { BlockPraos, Slot } from '@cardano-ogmios/schema';
import { dbService, eventService, operationWs } from '../indexerServices';
import { EntityManager } from 'typeorm';
import { Sync } from '../db/entities/Sync';

export class SyncIndexer extends BaseIndexer {
  async onRollForward(block: BlockPraos): Promise<any> {
    await dbService.transaction(
      async (manager: EntityManager): Promise<void> => {
        const updatedSync: Sync = Sync.make(block.id, block.slot);

        await manager.upsert(Sync, updatedSync, ['id']);

        eventService.pushEvent({
          type: 'SyncUpdated',
          data: updatedSync,
        });
      }
    );

    operationWs.broadcast(Sync.make(block.id, block.slot));

    return Promise.resolve();
  }

  async onRollBackward(blockHash: string, slot: Slot): Promise<any> {
    return await dbService.transaction(
      async (manager: EntityManager): Promise<void> => {
        await manager.upsert(Sync, Sync.make(blockHash, slot), ['id']);
      }
    );
  }
}
