import { dedupKey, parseLead, type Lead } from './lead';
import type { LeadStore } from './store';

export const DEDUP_TTL_SEC = 600;
export const RATE_LIMIT = 10;
export const RATE_WINDOW_SEC = 600;

type Deps = { store: LeadStore; notify: (lead: Lead) => Promise<void>; ip?: string };

const json = (body: unknown, status = 200) => Response.json(body, { status });

export async function handleLead(req: Request, { store, notify, ip }: Deps): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, field: 'body', message: 'Не удалось прочитать заявку.' }, 400);
  }

  // Скрытое поле-приманка: люди его не видят, боты заполняют. Отвечаем «успех», заявку не создаём.
  if (body && typeof body === 'object' && (body as Record<string, unknown>).website) return json({ ok: true });

  if (ip) {
    try {
      if ((await store.hit(`rate:${ip}`, RATE_WINDOW_SEC)) > RATE_LIMIT) {
        return json({ ok: false, field: 'rate', message: 'Слишком много заявок. Попробуйте позже или позвоните нам.' }, 429);
      }
    } catch (e) {
      console.error('lead: rate limit unavailable', e); // не блокируем людей из-за сбоя счётчика
    }
  }

  const parsed = parseLead(body);
  if (!parsed.ok) return json(parsed, 400);

  try {
    if (!(await store.claimAndSave(dedupKey(parsed.lead.phone), DEDUP_TTL_SEC, parsed.lead))) {
      return json({ ok: true, duplicate: true });
    }
  } catch (e) {
    console.error('lead: save failed', e);
    return json({ ok: false }, 502);
  }
  try {
    await notify(parsed.lead);
  } catch (e) {
    console.error('lead: telegram failed', e);
  }
  return json({ ok: true });
}
