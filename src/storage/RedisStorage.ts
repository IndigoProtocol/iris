import {BaseCacheStorage} from './BaseCacheStorage';
import {Redis} from "ioredis";
import {logError} from '../logger';
import CONFIG from '../config';
import {stringify} from "../utils";

export class RedisStorage extends BaseCacheStorage {

    /**
     * https://github.com/redis/node-redis
     */
    private _cache: Redis | undefined;

    public boot(): Promise<void> {
        this._cache = new Redis(CONFIG.REDIS_PORT, CONFIG.REDIS_HOST, {
            db: CONFIG.REDIS_DB,
            lazyConnect: true,
        })
        this._cache.on("error", (error) => logError(`Error : ${error}`));
        return this._cache.connect();
    }

    public setKey(key: string, data: any, ttlSecs: number = 604_800): Promise<any> {
        if (!this._cache) {
            throw new Error('CacheStorage not initialized.');
        }

        return this._cache.set(key, stringify(data), 'EX', ttlSecs);
    }

    public getKey(key: string, defaultTo: any = undefined): Promise<any> {
        if (!this._cache) {
            throw new Error('CacheStorage not initialized.');
        }

        return this._cache.get(key).then((value => value ? JSON.parse(value) : defaultTo));
    }

    public deleteKey(key: string): Promise<any> {
        if (!this._cache) {
            throw new Error('CacheStorage not initialized.');
        }

        return this._cache.del(key);
    }

    public flushAll(): Promise<any> {
        if (!this._cache) {
            throw new Error('CacheStorage not initialized.');
        }

        return this._cache.flushall();
    }

    public keys(): Promise<any> {
        if (!this._cache) {
            throw new Error('CacheStorage not initialized.');
        }

        return this._cache.keys('*');
    }

}