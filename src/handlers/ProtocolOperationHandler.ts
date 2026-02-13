import { ProtocolOperation } from '../types';
import { dbService, operationWs } from '../indexerServices';
import { BaseEntity } from 'typeorm';

export class ProtocolOperationHandler {

    public async handle(operation: ProtocolOperation): Promise<any> {
        // Errors are handled within
        return this.handleOperation(operation)
            .then((savedEntity: BaseEntity | undefined) => {
                if (savedEntity) {
                    operationWs.broadcast(savedEntity);
                }

                return Promise.resolve();
            })
            .catch(() => Promise.resolve());
    }

    /**
     * Store necessary data into the DB.
     */
    private async handleOperation(operation: ProtocolOperation): Promise<BaseEntity | undefined> {
        if (! dbService.isInitialized) {
            return Promise.resolve(undefined);
        }
        return Promise.resolve(undefined);
    }

}
