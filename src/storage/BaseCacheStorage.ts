export abstract class BaseCacheStorage {
  abstract boot(): Promise<void>;

  abstract setKey(key: string, data: any, ttlSecs?: number): Promise<any>;

  abstract getKey(key: string, defaultTo?: any): Promise<any>;

  abstract deleteKey(key: string): Promise<any>;

  abstract flushAll(): Promise<any>;

  abstract keys(): Promise<any>;
}
