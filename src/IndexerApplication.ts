import {
  ChainSynchronization,
  createChainSynchronizationClient,
  createInteractionContext,
  InteractionContext,
} from '@cardano-ogmios/client';
import {
  Block,
  BlockPraos,
  Point,
  PointOrOrigin,
  TipOrOrigin,
} from '@cardano-ogmios/schema';
import 'reflect-metadata';
import { EntityManager } from 'typeorm';
import CONFIG from './config';
import { FIRST_SYNC_BLOCK_HASH, FIRST_SYNC_SLOT } from './constants';
import { Sync } from './db/entities/Sync';
import { MinswapAnalyzer } from './dex/MinswapAnalyzer';
import { MinswapV2Analyzer } from './dex/MinswapV2Analyzer';
import { MuesliSwapAnalyzer } from './dex/MuesliSwapAnalyzer';
import { SplashAnalyzer } from './dex/SplashAnalyzer';
import { SundaeSwapAnalyzer } from './dex/SundaeSwapAnalyzer';
import { SundaeSwapV3Analyzer } from './dex/SundaeSwapV3Analyzer';
import { VyFiAnalyzer } from './dex/VyFiAnalyzer';
import { WingRidersAnalyzer } from './dex/WingRidersAnalyzer';
import { WingRidersV2Analyzer } from './dex/WingRidersV2Analyzer';
import { AmmDexTransactionIndexer } from './indexers/AmmDexTransactionIndexer';
import { BaseIndexer } from './indexers/BaseIndexer';
import { HybridDexTransactionIndexer } from './indexers/HybridDexTransactionIndexer';
import { OrderBookDexTransactionIndexer } from './indexers/OrderBookDexTransactionIndexer';
import { SyncIndexer } from './indexers/SyncIndexer';
import {
  dbService,
  eventService,
  metadataService,
  operationWs,
  queue,
} from './indexerServices';
import { BaseEventListener } from './listeners/BaseEventListener';
import { logError, logInfo } from './logger';
import { BaseCacheStorage } from './storage/BaseCacheStorage';
import { CacheStorage } from './storage/CacheStorage';
import { SpectrumAnalyzer } from './dex/SpectrumAnalyzer';
import { MinswapStableAnalyzer } from './dex/MinswapStableAnalyzer';
import { WingRidersStableV2Analyzer } from './dex/WingRidersStableV2Analyzer';

export class IndexerApplication {
  private readonly _cache: BaseCacheStorage;

  private _eventListeners: BaseEventListener[] = [];
  private _chainSyncClient:
    | ChainSynchronization.ChainSynchronizationClient
    | undefined = undefined;
  private _ogmiosContext: InteractionContext | undefined = undefined;

  /**
   * Indexers to make aware of new blocks & rollbacks.
   */
  private _indexers: BaseIndexer[] = [
    new SyncIndexer(),
    new AmmDexTransactionIndexer([
      new MinswapAnalyzer(this),
      new MinswapV2Analyzer(this),
      new MinswapStableAnalyzer(this),
      new SundaeSwapAnalyzer(this),
      new SundaeSwapV3Analyzer(this),
      new WingRidersAnalyzer(this),
      new WingRidersV2Analyzer(this),
      new SpectrumAnalyzer(this),
      new SplashAnalyzer(this),
      new WingRidersStableV2Analyzer(this),
      // new TeddySwapAnalyzer(this),
      new VyFiAnalyzer(this),
    ]),
    new OrderBookDexTransactionIndexer([
      // new GeniusYieldAnalyzer(this),
      // new AxoAnalyzer(this),
    ]),
    new HybridDexTransactionIndexer([new MuesliSwapAnalyzer(this)]),
  ];

  /**
   * IndexerApplication constructor.
   */
  constructor(cache?: BaseCacheStorage, indexers: BaseIndexer[] = []) {
    this._cache = cache ?? new CacheStorage();
    this._indexers = [...this._indexers, ...indexers];
  }

  /**
   * Retrieve instance of storage.
   */
  get cache(): BaseCacheStorage {
    return this._cache;
  }

  get ogmios(): InteractionContext | undefined {
    return this._ogmiosContext;
  }

  get indexers(): BaseIndexer[] {
    return this._indexers;
  }

  public withEventListeners(
    eventListeners: BaseEventListener[]
  ): IndexerApplication {
    this._eventListeners = eventListeners;

    return this;
  }

  public withIndexers(indexers: BaseIndexer[]): IndexerApplication {
    this._indexers = [...this._indexers, ...indexers];

    return this;
  }

  /**
   * Start application.
   */
  public async start(): Promise<any> {
    return Promise.all([this._cache.boot(), this.bootServices()]).then(() =>
      this.bootOgmios()
    );
  }

  /**
   * Boot all necessary services for application.
   */
  private async bootServices(): Promise<any> {
    logInfo('Booting services...');

    return Promise.all([
      dbService.boot(this),
      eventService.boot(this, this._eventListeners),
      operationWs.boot(),
      metadataService.boot(),
      queue.boot(),
    ])
      .then(() => {
        logInfo('Services booted');
      })
      .catch((reason) => {
        logError(reason);
        process.exit(0);
      });
  }

  /**
   * Boot Ogmios connection.
   */
  private async bootOgmios(): Promise<any> {
    logInfo('Booting Ogmios connection...');

    this._ogmiosContext = await createInteractionContext(
      (err) => logError(err.message),
      () => {
        logError('Ogmios connection closed. Restarting...');

        this.start();
      },
      {
        connection: {
          host: CONFIG.OGMIOS_HOST,
          port: CONFIG.OGMIOS_PORT,
          tls: CONFIG.OGMIOS_TLS,
        },
      }
    )
      .then((context: InteractionContext) => {
        logInfo('Ogmios connected');

        return context;
      })
      .catch((reason) => {
        logError(reason);
        process.exit(0);
      });

    this._chainSyncClient = await createChainSynchronizationClient(
      this._ogmiosContext,
      {
        rollForward: this.rollForward.bind(this),
        rollBackward: this.rollBackward.bind(this),
      },
      {
        sequential: true,
      }
    );

    const lastSync: Sync | undefined = await dbService.transaction(
      async (manager: EntityManager): Promise<Sync | undefined> => {
        return (
          (await manager.findOneBy(Sync, {
            id: 1,
          })) ?? undefined
        );
      }
    );

    /**
     * SundaeSwap    - 50367177,  91c16d5ae92f2eb791c3c2da9b38126b98623b07f611d4a4b913f0ab2af721d2
     * Minswap       - 56553560,  f6579343856a49cd76f713c2ac9ded86690bec029878ca67b87e9caa80d4de18
     * WingRiders    - 57274883,  2793f430b0ae3fa2a64a3d6aa7f3aad87e0af34239a52f36b26353756a423b34
     * MuesliSwap    - 64985346,  8cfa563e6f3ed6e810e95b6fce681b3e974ac311b0e6066e3f97528a7bef5eca
     * VyFi          - 92003644,  bc671f811db2d4ecb25fd11e444aee98a42eb0132729982f9cd7f80a1bc84b73
     * Spectrum      - 98301694,  d0d2abcaf741be13d353ac80b0f9001d7b323a2b5827ff2dce6480bf032dd3db
     * TeddySwap     - 109078697, 8494922f6266885a671408055d7123e1c7bdf78b9cd86720680c55c1f94e839e
     * GeniusYield   - 110315300, d7281a52d68eef89a7472860fdece323ecc39d3054cdd1fa0825afe56b942a86
     * Splash        - 116958314, 6e783dc520d3e9991e52098c280b7156c6c8dd58446f3db59af04d50a65987d5
     * SundaeSwap v3 - 123703733, 3e5f5bca1d1ae0749c808d29817212ef64606c79732d238d6492a085057b493f
     * Minswap v2    - 128247239, d7edc62dcfeb8e809f4a8584354b9bf0df640d365ff47cb26a0f9e972ba1dca4
     * WingRiders v2 - 133880255, 5cab603d6ca6f5dd5bc0ae92cbe7f4b796f330004ca64b5ad74c2e27577fb539
     */
    return lastSync
      ? this._chainSyncClient?.resume([
          { slot: lastSync.slot, id: lastSync.blockHash },
        ])
      : this._chainSyncClient?.resume([
          { slot: FIRST_SYNC_SLOT, id: FIRST_SYNC_BLOCK_HASH },
        ]);
  }

  /**
   * Handler for Ogmios new block. Send to all indexers.
   * @param update - New block update.
   * @param requestNext - Callback to request next block.
   */
  private async rollForward(
    update: { block: Block; tip: TipOrOrigin },
    requestNext: () => void
  ): Promise<void> {
    if (update.block.type === 'praos') {
      const block: BlockPraos = update.block;

      logInfo(`====== Analyzing block at slot ${block.slot} ======`);

      await Promise.all(
        this._indexers.map((indexer: BaseIndexer) =>
          indexer.onRollForward(block)
        )
      );

      if (queue.size > 0) {
        logInfo(`[Queue] Running jobs`);
        await queue.settle();
        logInfo('[Queue] Finished jobs');
      }

      logInfo(`====== Finished with block at slot ${block.slot} ======`);
    }

    requestNext();
  }

  /**
   * Handler for Ogmios rollback. Send to all indexers.
   * @param update - Point in which to revert to.
   * @param requestNext - Callback to request next block.
   */
  private async rollBackward(
    update: { point: PointOrOrigin },
    requestNext: () => void
  ): Promise<void> {
    if (typeof update.point === 'object' && 'slot' in update.point) {
      logInfo(`Rollback occurred to slot ${update.point.slot}`);

      const point: Point = update.point;

      await Promise.all(
        this._indexers.map((indexer: BaseIndexer) =>
          indexer.onRollBackward(point.id, point.slot)
        )
      );
    }

    requestNext();
  }
}
