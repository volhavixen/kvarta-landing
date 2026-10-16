import type { Source } from './lead';

const KEY = 'kv-source';
const AD_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid', 'yclid'] as const;

type Store = Pick<Storage, 'getItem' | 'setItem'>;

const hasAd = (s: Source) => AD_KEYS.some((k) => s[k]);

/**
 * Источник заявки: UTM, метки кликов (gclid/fbclid/yclid), реферер и страница.
 * Первый заход не перезаписывается, кроме случая, когда он был без рекламных меток,
 * а новый пришёл с рекламы: тогда важнее рекламный.
 */
export function readAttribution(storage: Store, search: string, referrer: string, path: string): Source {
  let saved: Source | null = null;
  try {
    const raw = storage.getItem(KEY);
    if (raw) saved = JSON.parse(raw) as Source;
  } catch {}
  if (saved && hasAd(saved)) return saved;
  const q = new URLSearchParams(search);
  const current = { page: path, referrer, ...Object.fromEntries(AD_KEYS.map((k) => [k, q.get(k) ?? ''])) } as Source;
  if (saved && !hasAd(current)) return saved;
  try {
    storage.setItem(KEY, JSON.stringify(current));
  } catch {}
  return current;
}
