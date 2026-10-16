import { dedupKey, parseLead, type Lead } from './lead';
import type { LeadStore } from './store';
import { GLOBAL_LIMIT, GLOBAL_WINDOW_SEC, MAX_BODY_BYTES, MIN_FILL_MS, isFakePhone, looksLikeSpam, originAllowed } from './spam';

export const DEDUP_TTL_SEC = 600;
export const RATE_LIMIT = 10;
export const RATE_WINDOW_SEC = 600;

type Deps = {
  store: LeadStore;
  notify: (lead: Lead) => Promise<void>;
  ip?: string;
  /** Проверка токена капчи. Не задана: проверка выключена. */
  verifyHuman?: (token: string, ip?: string) => Promise<boolean>;
  /** Сообщение менеджеру о нештатной ситуации (например, превышен потолок заявок). */
  alert?: (text: string) => Promise<void>;
  now?: () => number;
};

const json = (body: unknown, status = 200) => Response.json(body, { status });

export async function handleLead(req: Request, { store, notify, ip, verifyHuman, alert, now = Date.now }: Deps): Promise<Response> {
  if (!(req.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) {
    return json({ ok: false, field: 'body', message: 'Неверный формат запроса.' }, 415);
  }
  if (!originAllowed(req)) return json({ ok: false, field: 'body', message: 'Запрос отклонён.' }, 403);
  if (Number(req.headers.get('content-length')) > MAX_BODY_BYTES) return json({ ok: false, field: 'body', message: 'Заявка слишком большая.' }, 413);

  let body: unknown;
  try {
    const text = await req.text();
    if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return json({ ok: false, field: 'body', message: 'Заявка слишком большая.' }, 413);
    body = JSON.parse(text);
  } catch {
    return json({ ok: false, field: 'body', message: 'Не удалось прочитать заявку.' }, 400);
  }
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;

  // Признаки бота: боту отвечаем «успех», заявку не создаём, чтобы он не подстраивался.
  if (b.website) return json({ ok: true }); // скрытое поле-приманка
  const loadedAt = Number(b.loadedAt);
  if (!Number.isFinite(loadedAt) || now() - loadedAt < MIN_FILL_MS) return json({ ok: true }); // форма заполнена быстрее человека

  if (verifyHuman && !(await verifyHuman(typeof b.turnstileToken === 'string' ? b.turnstileToken : '', ip))) {
    return json({ ok: false, field: 'captcha', message: 'Не удалось подтвердить, что вы не робот. Обновите страницу и попробуйте снова.' }, 403);
  }

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

  if (isFakePhone(parsed.lead.phone) || looksLikeSpam(parsed.lead.name, parsed.lead.comment)) return json({ ok: true });

  try {
    const total = await store.hit('rate:global', GLOBAL_WINDOW_SEC);
    if (total > GLOBAL_LIMIT) {
      if (total === GLOBAL_LIMIT + 1) {
        await alert?.(`⚠️ Потолок заявок превышен: больше ${GLOBAL_LIMIT} за час. Новые заявки отклоняются, возможна спам-атака.`).catch((e) => console.error('lead: alert failed', e));
      }
      return json({ ok: false, field: 'rate', message: 'Слишком много заявок. Позвоните нам.' }, 429);
    }
  } catch (e) {
    console.error('lead: global limit unavailable', e);
  }

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
