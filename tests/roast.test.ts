import { describe, expect, test } from 'vitest';
import { roastLabels } from '@/lib/roast';

describe('roastLabels', () => {
  test('среда → ближайший четверг', () => {
    const r = roastLabels(new Date('2026-10-21T12:00:00Z'));
    expect(r.dm).toBe('22.10');
    expect(r.fridm).toBe('23.10');
    expect(r.long).toBe('22 октября');
    expect(r.batchNum).toBe('43-26');
    expect(r.whenWord).toBe('завтра');
  });
  test('понедельник → в четверг', () => {
    expect(roastLabels(new Date('2026-10-19T09:00:00Z')).whenWord).toBe('в четверг');
  });
  test('четверг → сегодня', () => {
    const r = roastLabels(new Date('2026-10-22T10:00:00Z'));
    expect(r.dm).toBe('22.10');
    expect(r.whenWord).toBe('сегодня');
  });
  test('пятница → следующий четверг', () => {
    expect(roastLabels(new Date('2026-10-23T10:00:00Z')).dm).toBe('29.10');
  });
  test('00:30 четверга по Минску (21:30Z среды) ещё четверг', () => {
    const r = roastLabels(new Date('2026-10-21T21:30:00Z'));
    expect(r.dm).toBe('22.10');
    expect(r.whenWord).toBe('сегодня');
  });
});
