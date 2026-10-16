import { describe, expect, test } from 'vitest';
import { readAttribution } from '@/lib/attribution';

const memory = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
};

describe('readAttribution', () => {
  test('сохраняет utm, реферер и страницу первого захода', () => {
    const s = readAttribution(memory(), '?utm_source=ig&utm_campaign=oct', 'https://l.instagram.com/', '/');
    expect(s).toMatchObject({ utm_source: 'ig', utm_campaign: 'oct', referrer: 'https://l.instagram.com/', page: '/' });
  });
  test('повторный вызов не перезаписывает первый источник', () => {
    const st = memory();
    readAttribution(st, '?utm_source=ig', '', '/');
    expect(readAttribution(st, '?utm_source=yandex', '', '/x').utm_source).toBe('ig');
  });
  test('хранилище недоступно: источник всё равно возвращается', () => {
    const broken = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };
    expect(readAttribution(broken, '?utm_source=tg', '', '/').utm_source).toBe('tg');
  });
});
