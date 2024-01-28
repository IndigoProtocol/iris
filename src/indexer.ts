import { IndexerApplication } from './IndexerApplication';
import { logError, logInfo } from './logger';
import { CacheStorage } from './storage/CacheStorage';

export const indexerApp: IndexerApplication = new IndexerApplication(
    new CacheStorage()
);

await indexerApp.start()
    .then(() => {
        logInfo('IndexerApplication started');
    })
    .catch((reason) => {
        logError(`IndexerApplication failed to start : ${reason}`);
    });
