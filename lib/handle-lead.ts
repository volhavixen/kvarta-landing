import { dedupKey, parseLead, type Lead } from './lead';
import type { LeadStore } from './store';

export const DEDUP_TTL_SEC = 600;

type Deps = { store: LeadStore; notify: (lead: Lead) => Promise<void> };

const json = (body: unknown, status = 200) => Response.json(body, { status });

export async function handleLead(req: Request, { store, notify }: Deps): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, field: 'body', message: 'Не удалось прочитать заявку.' }, 400);
  }
  const parsed = parseLead(body);
  if (!parsed.ok) return json(parsed, 400);

  const key = dedupKey(parsed.lead.phone);
  try {
    if (!(await store.claim(key, DEDUP_TTL_SEC))) return json({ ok: true, duplicate: true });
  } catch (e) {
    console.error('lead: claim failed', e);
    return json({ ok: false }, 502);
  }
  try {
    await store.save(parsed.lead);
  } catch (e) {
    console.error('lead: save failed', e);
    await store.release(key).catch(() => {});
    return json({ ok: false }, 502);
  }
  try {
    await notify(parsed.lead);
  } catch (e) {
    console.error('lead: telegram failed', e);
  }
  return json({ ok: true });
}
