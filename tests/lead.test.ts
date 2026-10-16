import { describe, expect, test } from 'vitest';
import { dedupKey, formatTelegram, parseLead } from '@/lib/lead';

const base = { name: 'Аня', phone: '+375 (29) 123-45-67', type: 'subscription', comment: '', source: { page: '/', utm_campaign: 'oct' } };

describe('parseLead', () => {
  test('неверный код → ошибка поля phone', () => {
    const r = parseLead({ ...base, phone: '+375991234567' });
    expect(r).toMatchObject({ ok: false, field: 'phone' });
  });
  test('неизвестный тип → ошибка поля type', () => {
    expect(parseLead({ ...base, type: 'x' })).toMatchObject({ ok: false, field: 'type' });
  });
  test('не объект → ошибка body', () => {
    expect(parseLead('str')).toMatchObject({ ok: false, field: 'body' });
  });
  test('имя до 80, комментарий до 1000 символов', () => {
    const r = parseLead({ ...base, name: 'я'.repeat(200), comment: 'к'.repeat(5000) });
    if (!r.ok) throw new Error('ожидалась валидная заявка');
    expect(r.lead.name).toHaveLength(80);
    expect(r.lead.comment).toHaveLength(1000);
    expect(r.lead.phone).toBe('+375291234567');
  });
});

describe('dedupKey', () => {
  test('разные форматы одного номера → один ключ', () => {
    const a = parseLead({ ...base, phone: '80291234567' });
    const b = parseLead({ ...base, phone: '+375 29 123-45-67' });
    if (!a.ok || !b.ok) throw new Error('ожидались валидные заявки');
    expect(dedupKey(a.lead.phone)).toBe(dedupKey(b.lead.phone));
  });
});

describe('formatTelegram', () => {
  test('экранирует HTML и содержит источник', () => {
    const r = parseLead({ ...base, name: '<b>x</b>' });
    if (!r.ok) throw new Error('ожидалась валидная заявка');
    const t = formatTelegram(r.lead);
    expect(t).toContain('&lt;b&gt;');
    expect(t).not.toContain('<b>x</b>');
    expect(t).toContain('oct');
    expect(t).toContain('/');
  });
});
