import { BaseIndexer } from './BaseIndexer';
import { BlockAlonzo, BlockBabbage, Slot } from '@cardano-ogmios/schema';
import { dbService, operationWs } from '../indexerServices';
import { EntityManager } from 'typeorm';
import { Sync } from '../db/entities/Sync';

export class SyncIndexer extends BaseIndexer {

    async onRollForward(block: BlockBabbage | BlockAlonzo): Promise<any> {
        if (block.header) {
            await dbService.transaction(async (manager: EntityManager): Promise<void> => {
                await manager.upsert(
                    Sync,
                    Sync.make(block.headerHash, block.header.slot),
                    ['id']
                );
            });

            operationWs.broadcast(Sync.make(block.headerHash, block.header.slot));
        }

        return Promise.resolve();
    }

    async onRollBackward(blockHash: string, slot: Slot): Promise<any> {
        return await dbService.transaction(async (manager: EntityManager): Promise<void> => {
            await manager.upsert(
                Sync,
                Sync.make(blockHash, slot),
                ['id']
            );
        });
    }

}
