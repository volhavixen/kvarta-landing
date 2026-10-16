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

describe('readAttribution: реклама после органики и click id', () => {
  test('заход без меток, затем с рекламы: берётся рекламный', () => {
    const st = memory();
    readAttribution(st, '', '', '/');
    expect(readAttribution(st, '?utm_source=ig', '', '/').utm_source).toBe('ig');
  });
  test('сохраняет gclid, fbclid и yclid', () => {
    const s = readAttribution(memory(), '?gclid=g1&fbclid=f1&yclid=y1', '', '/');
    expect(s).toMatchObject({ gclid: 'g1', fbclid: 'f1', yclid: 'y1' });
  });
});
