import {IndexerApplication} from './IndexerApplication';
import {logError, logInfo} from './logger';
import {RedisStorage} from "./storage/RedisStorage";

const indexerApp: IndexerApplication = new IndexerApplication(
    new RedisStorage()
);

await indexerApp.start()
    .then(() => {
        logInfo('IndexerApplication started');
    })
    .catch((reason) => {
        logError(`IndexerApplication failed to start : ${reason}`);
    });
