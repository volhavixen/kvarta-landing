import type { Source } from './lead';

const KEY = 'kv-source';
const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

type Store = Pick<Storage, 'getItem' | 'setItem'>;

/** Источник первого захода: UTM, реферер и страница. Не перезаписывается в рамках сессии. */
export function readAttribution(storage: Store, search: string, referrer: string, path: string): Source {
  try {
    const saved = storage.getItem(KEY);
    if (saved) return JSON.parse(saved) as Source;
  } catch {}
  const q = new URLSearchParams(search);
  const source = { page: path, referrer, ...Object.fromEntries(UTM.map((k) => [k, q.get(k) ?? ''])) } as Source;
  try {
    storage.setItem(KEY, JSON.stringify(source));
  } catch {}
  return source;
}
