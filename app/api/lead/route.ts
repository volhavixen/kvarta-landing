import { checkBotId } from 'botid/server';
import { handleLead } from '@/lib/handle-lead';
import { createStore } from '@/lib/store';
import { verifyTurnstile } from '@/lib/spam';
import { alertTelegram, notifyTelegram } from '@/lib/telegram';

export const runtime = 'nodejs';

/** BotID работает только на Vercel; при сбое проверки заявки не блокируем. */
async function isBot(): Promise<boolean> {
  try {
    return (await checkBotId()).isBot;
  } catch (e) {
    console.error('lead: botid unavailable', e);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    if (process.env.VERCEL && (await isBot())) return Response.json({ ok: false }, { status: 403 });
    return await handleLead(req, { store: createStore(), notify: notifyTelegram, alert: alertTelegram, verifyHuman: verifyTurnstile, ip: req.headers.get('x-forwarded-for')?.split(',')[0].trim() });
  } catch (e) {
    console.error('lead: unexpected', e);
    return Response.json({ ok: false }, { status: 502 });
  }
}
