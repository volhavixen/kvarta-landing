import { Redis } from '@upstash/redis';
import type { Lead } from './lead';

export interface LeadStore {
  /** true, если ключ занят впервые (NX) и на него поставлен TTL. */
  claim(key: string, ttlSec: number): Promise<boolean>;
  release(key: string): Promise<void>;
  save(lead: Lead): Promise<void>;
}

export function createStore(): LeadStore {
  const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! });
  return {
    async claim(key, ttlSec) {
      return (await redis.set(key, '1', { nx: true, ex: ttlSec })) === 'OK';
    },
    async release(key) {
      await redis.del(key);
    },
    async save(lead) {
      await redis.lpush('leads', JSON.stringify(lead));
    },
  };
}
