import { handleLead } from '@/lib/handle-lead';
import { createStore } from '@/lib/store';
import { notifyTelegram } from '@/lib/telegram';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    return await handleLead(req, { store: createStore(), notify: notifyTelegram });
  } catch (e) {
    console.error('lead: unexpected', e);
    return Response.json({ ok: false }, { status: 502 });
  }
}
