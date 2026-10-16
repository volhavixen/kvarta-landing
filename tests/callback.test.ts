import { describe, expect, test } from 'vitest';
import { callbackText } from '@/lib/callback';

describe('callbackText', () => {
  test('будни, мастерская работает', () => {
    expect(callbackText(new Date('2026-10-21T07:00:00Z'))).toContain('в течение 30 минут');
  });
  test('будни 19:45 → завтра после 8:00', () => {
    expect(callbackText(new Date('2026-10-21T16:45:00Z'))).toBe('завтра после 8:00.');
  });
  test('суббота 09:00 → сегодня после 10:00', () => {
    expect(callbackText(new Date('2026-10-24T06:00:00Z'))).toBe('сегодня после 10:00.');
  });
  test('пятница 21:00 → завтра после 10:00', () => {
    expect(callbackText(new Date('2026-10-23T18:00:00Z'))).toBe('завтра после 10:00.');
  });
});
