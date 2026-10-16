import { Redis } from '@upstash/redis';
import type { Lead } from './lead';

export interface LeadStore {
  /** Атомарно: если ключ свободен, занимает его на ttlSec и сохраняет заявку. false, если ключ уже занят. */
  claimAndSave(key: string, ttlSec: number, lead: Lead): Promise<boolean>;
  /** Счётчик запросов в окне windowSec; возвращает число запросов, включая текущий. */
  hit(key: string, windowSec: number): Promise<number>;
}

// Один вызов Redis: занять ключ и положить заявку. Нет окна, в котором номер занят, а заявки нет.
const CLAIM_AND_SAVE = `
if redis.call('SET', KEYS[1], '1', 'NX', 'EX', ARGV[1]) then
  redis.call('LPUSH', KEYS[2], ARGV[2])
  return 1
end
return 0`;

export function createStore(): LeadStore {
  const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! });
  return {
    async claimAndSave(key, ttlSec, lead) {
      const r = await redis.eval(CLAIM_AND_SAVE, [key, 'leads'], [String(ttlSec), JSON.stringify(lead)]);
      return Number(r) === 1;
    },
    async hit(key, windowSec) {
      const n = await redis.incr(key);
      if (n === 1) await redis.expire(key, windowSec);
      return n;
    },
  };
}
