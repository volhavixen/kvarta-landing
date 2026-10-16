import { checkPhone, toE164 } from './phone';

export const LEAD_TYPES = ['subscription', 'once', 'question'] as const;
export type LeadType = (typeof LEAD_TYPES)[number];

const SOURCE_KEYS = ['page', 'referrer', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
export type Source = Record<(typeof SOURCE_KEYS)[number], string>;

export type Lead = { name: string; phone: string; type: LeadType; comment: string; source: Source; createdAt: string };

export type ParseResult =
  | { ok: true; lead: Lead }
  | { ok: false; field: 'phone' | 'type' | 'body'; message: string };

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export function parseLead(body: unknown, now: Date = new Date()): ParseResult {
  if (!body || typeof body !== 'object') return { ok: false, field: 'body', message: 'Пустая заявка.' };
  const b = body as Record<string, unknown>;
  const phoneRaw = typeof b.phone === 'string' ? b.phone : '';
  const phoneError = checkPhone(phoneRaw);
  if (phoneError) return { ok: false, field: 'phone', message: phoneError };
  if (!LEAD_TYPES.includes(b.type as LeadType)) return { ok: false, field: 'type', message: 'Выберите, что вас интересует.' };
  const src = (b.source && typeof b.source === 'object' ? b.source : {}) as Record<string, unknown>;
  const source = Object.fromEntries(SOURCE_KEYS.map((k) => [k, str(src[k], 300)])) as Source;
  return {
    ok: true,
    lead: {
      name: str(b.name, 80),
      phone: toE164(phoneRaw),
      type: b.type as LeadType,
      comment: str(b.comment, 1000),
      source,
      createdAt: now.toISOString(),
    },
  };
}

export const dedupKey = (phoneE164: string) => `lead:${phoneE164}`;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const TYPE_LABEL: Record<LeadType, string> = { subscription: 'Подписка', once: 'Разовый заказ', question: 'Вопрос' };

export function formatTelegram(l: Lead): string {
  const s = l.source;
  const utm = SOURCE_KEYS.filter((k) => k.startsWith('utm_') && s[k]).map((k) => `${k}: ${esc(s[k])}`);
  return [
    `<b>Новая заявка: ${TYPE_LABEL[l.type]}</b>`,
    `Имя: ${esc(l.name) || '—'}`,
    `Телефон: ${esc(l.phone)}`,
    l.comment ? `Комментарий: ${esc(l.comment)}` : '',
    '',
    `Страница: ${esc(s.page) || '—'}`,
    `Реферер: ${esc(s.referrer) || '—'}`,
    utm.length ? utm.join('\n') : 'UTM: нет',
  ].filter((x, i) => x !== '' || i === 4).join('\n');
}
