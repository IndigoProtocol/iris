import { BaseCacheStorage } from './BaseCacheStorage';
import NodeCache from 'node-cache';

export class CacheStorage extends BaseCacheStorage {
  /**
   * https://github.com/node-cache/node-cache
   */
  private _cache: NodeCache | undefined;

  public boot(): Promise<void> {
    this._cache = new NodeCache({
      checkperiod: 60,
      useClones: false,
      stdTTL: 0,
    });

    return Promise.resolve();
  }

  public setKey(
    key: string,
    data: any,
    ttlSecs: number = 604_800
  ): Promise<any> {
    if (!this._cache) {
      throw new Error('CacheStorage not initialized.');
    }

    this._cache.set(key, data, ttlSecs);

    return Promise.resolve();
  }

  public getKey(key: string, defaultTo: any = undefined): Promise<any> {
    if (!this._cache) {
      throw new Error('CacheStorage not initialized.');
    }

    return Promise.resolve(this._cache.get(key) ?? defaultTo);
  }

  public deleteKey(key: string): Promise<any> {
    if (!this._cache) {
      throw new Error('CacheStorage not initialized.');
    }

    this._cache.del(key);

    return Promise.resolve();
  }

  public flushAll(): Promise<any> {
    if (!this._cache) {
      throw new Error('CacheStorage not initialized.');
    }

    this._cache.flushAll();

    return Promise.resolve();
  }

  public keys(): Promise<any> {
    if (!this._cache) {
      throw new Error('CacheStorage not initialized.');
    }

    return Promise.resolve(this._cache.keys());
  }
}
