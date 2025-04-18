import CONFIG from './config';
import { IndexerApplication } from './IndexerApplication';
import { logError, logInfo } from './logger';
import { CacheStorage } from './storage/CacheStorage';

const indexerApp: IndexerApplication = new IndexerApplication(
  new CacheStorage()
);

if (CONFIG.HALT) {
  logInfo('Indexer is halted ...');
  await new Promise((resolve) => {
    setTimeout(
      () => {
        resolve(0);
      },
      1000 * 60 * 60 * 24
    );
  });
}

await indexerApp
  .start()
  .then(() => {
    logInfo('IndexerApplication started');
  })
  .catch((reason) => {
    logError(`IndexerApplication failed to start : ${reason}`);
  });
