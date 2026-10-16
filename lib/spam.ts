export const MAX_BODY_BYTES = 8 * 1024;
export const MIN_FILL_MS = 3000;
export const GLOBAL_LIMIT = 30;
export const GLOBAL_WINDOW_SEC = 3600;

/** Номер вида 1111111, 1234567, 1212121: у реального абонента так не бывает. Принимает E.164 (+375XXXXXXXXX). */
export function isFakePhone(e164: string): boolean {
  const local = e164.replace(/\D/g, '').slice(5); // после 375 и кода оператора
  if (new Set(local).size <= 2) return true;
  const asc = '01234567890123456789';
  const desc = '98765432109876543210';
  return asc.includes(local) || desc.includes(local);
}

const LINK = /https?:|www\.|\bt\.me\b|\b[\w-]+\.(com|ru|net|org|xyz|top|click|info|biz|su|site|online|link|cc|tk)\b/i;
const KEYWORDS = /казино|casino|крипт|bitcoin|биткоин|viagra|виагра|порно|porn|займ|ставки на спорт|быстрый заработок|заработок в интернете|seo[- ]?продвижение|telegram\.me/i;

/** Ссылки и спам-слова в свободных полях. */
export function looksLikeSpam(...fields: string[]): boolean {
  return fields.some((f) => LINK.test(f) || KEYWORDS.test(f));
}

/** Запрос пришёл со страницы нашего сайта: Origin (или Referer) совпадает с хостом запроса или ALLOWED_ORIGINS. */
export function originAllowed(req: Request, allowedEnv = process.env.ALLOWED_ORIGINS ?? ''): boolean {
  const from = req.headers.get('origin') ?? req.headers.get('referer');
  if (!from) return false;
  let host: string;
  try {
    host = new URL(from).host;
  } catch {
    return false;
  }
  const own = [req.headers.get('x-forwarded-host'), req.headers.get('host'), new URL(req.url).host];
  const extra = allowedEnv.split(',').map((s) => s.trim()).filter(Boolean).map((s) => s.replace(/^https?:\/\//, '').replace(/\/$/, ''));
  return [...own, ...extra].some((h) => h === host);
}

/** Токен Cloudflare Turnstile. Без секрета проверка выключена; при сбое Cloudflare заявки не блокируем. */
export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn('turnstile: TURNSTILE_SECRET_KEY не задан, проверка пропущена');
    return true;
  }
  if (!token) return false;
  try {
    const form = new URLSearchParams({ secret, response: token });
    if (ip) form.set('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`siteverify ${res.status}`);
    return (await res.json()).success === true;
  } catch (e) {
    console.error('turnstile: verify unavailable', e);
    return true;
  }
}
