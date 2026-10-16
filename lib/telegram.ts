import { formatTelegram, type Lead } from './lead';

/** Дубль заявки в Telegram. Без токена тихо пропускаем. */
export async function notifyTelegram(lead: Lead): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn('telegram: TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID не заданы, уведомление менеджеру не отправлено');
    return;
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: formatTelegram(lead), parse_mode: 'HTML' }),
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) throw new Error(`Telegram ${res.status}`);
}
