import { describe, expect, test } from 'vitest';
import { compareSubscription } from '@/lib/calc';

describe('compareSubscription', () => {
  test('Эфиопия + Колумбия: экономия 7 BYN', () => {
    const r = compareSubscription(32, 29);
    expect(r).toMatchObject({ once: 61, sub: 54, diff: 7, state: 'save' });
    expect(r.note).toContain('84 BYN за год');
  });
  test('Бразилия + Бразилия: подписка дороже на 2 BYN', () => {
    const r = compareSubscription(26, 26);
    expect(r).toMatchObject({ once: 52, diff: -2, state: 'more' });
    expect(r.note).toContain('дороже на 2 BYN');
  });
  test('равная цена', () => {
    expect(compareSubscription(27, 27)).toMatchObject({ diff: 0, state: 'same' });
  });
});
