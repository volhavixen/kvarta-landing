import { describe, expect, test } from 'vitest';
import { handleLead } from '@/lib/handle-lead';
import type { Lead } from '@/lib/lead';
import type { LeadStore } from '@/lib/store';

function fakeStore(opts: { saveThrows?: boolean; hitThrows?: boolean } = {}) {
  const keys = new Set<string>();
  const saved: Lead[] = [];
  const hits = new Map<string, number>();
  const store: LeadStore = {
    async claimAndSave(key, _ttl, lead) {
      if (opts.saveThrows) throw new Error('redis down');
      if (keys.has(key)) return false;
      keys.add(key);
      saved.push(lead);
      return true;
    },
    async hit(key) {
      if (opts.hitThrows) throw new Error('redis down');
      const n = (hits.get(key) ?? 0) + 1;
      hits.set(key, n);
      return n;
    },
  };
  return { store, saved, keys };
}

const body = { name: 'Аня', phone: '+375 (29) 713-45-68', type: 'once', comment: '', source: { page: '/' }, loadedAt: Date.now() - 60_000 };
const req = (b: unknown, raw?: string, h: Record<string, string> = {}) =>
  new Request('http://x/api/lead', { method: 'POST', body: raw ?? JSON.stringify(b), headers: { 'content-type': 'application/json', origin: 'http://x', ...h } });

describe('handleLead', () => {
  test('валидная заявка: 200, save и notify по разу', async () => {
    const { store, saved } = fakeStore();
    let notified = 0;
    const res = await handleLead(req(body), { store, notify: async () => { notified++; } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(saved).toHaveLength(1);
    expect(notified).toBe(1);
  });
  test('повтор того же номера в другом формате: 200 duplicate, save один', async () => {
    const { store, saved } = fakeStore();
    const deps = { store, notify: async () => {} };
    await handleLead(req(body), deps);
    const res = await handleLead(req({ ...body, phone: '80297134568' }), deps);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, duplicate: true });
    expect(saved).toHaveLength(1);
  });
  test('Redis недоступен: 502, заявка не создана', async () => {
    const { store, keys } = fakeStore({ saveThrows: true });
    const res = await handleLead(req(body), { store, notify: async () => {} });
    expect(res.status).toBe(502);
    expect(keys.size).toBe(0);
  });
  test('заполненная приманка: успех, но заявки нет', async () => {
    const { store, saved } = fakeStore();
    const res = await handleLead(req({ ...body, website: 'http://spam' }), { store, notify: async () => {} });
    expect(res.status).toBe(200);
    expect(saved).toHaveLength(0);
  });
  test('больше 10 запросов с одного IP: 429', async () => {
    const { store } = fakeStore();
    const deps = { store, notify: async () => {}, ip: '1.2.3.4' };
    let last = 200;
    for (let i = 0; i < 11; i++) last = (await handleLead(req({ ...body, phone: `+37529123456${i % 10}` }), deps)).status;
    expect(last).toBe(429);
  });
  test('сбой счётчика не блокирует заявку', async () => {
    const { store, saved } = fakeStore({ hitThrows: true });
    const res = await handleLead(req(body), { store, notify: async () => {}, ip: '1.2.3.4' });
    expect(res.status).toBe(200);
    expect(saved).toHaveLength(1);
  });
  test('Telegram упал: заявка принята', async () => {
    const { store, saved } = fakeStore();
    const res = await handleLead(req(body), { store, notify: async () => { throw new Error('tg'); } });
    expect(res.status).toBe(200);
    expect(saved).toHaveLength(1);
  });
  test('неверный номер: 400 с field phone', async () => {
    const { store } = fakeStore();
    const res = await handleLead(req({ ...body, phone: '+375991234567' }), { store, notify: async () => {} });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ ok: false, field: 'phone' });
  });
  test('не JSON: 400', async () => {
    const { store } = fakeStore();
    const res = await handleLead(req(null, 'not json'), { store, notify: async () => {} });
    expect(res.status).toBe(400);
  });

  describe('защита от спама', () => {
    const deps = () => ({ ...fakeStore(), notify: async () => {} });
    test('не JSON по Content-Type: 415', async () => {
      const { store } = deps();
      expect((await handleLead(req(body, undefined, { 'content-type': 'text/plain' }), { store, notify: async () => {} })).status).toBe(415);
    });
    test('чужой Origin и отсутствие Origin: 403', async () => {
      const { store } = deps();
      expect((await handleLead(req(body, undefined, { origin: 'http://evil.com' }), { store, notify: async () => {} })).status).toBe(403);
      const noOrigin = new Request('http://x/api/lead', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
      expect((await handleLead(noOrigin, { store, notify: async () => {} })).status).toBe(403);
    });
    test('тело больше лимита: 413', async () => {
      const { store } = deps();
      expect((await handleLead(req({ ...body, comment: 'a'.repeat(9000) }), { store, notify: async () => {} })).status).toBe(413);
    });
    test('форма заполнена быстрее 3 секунд: успех, заявки нет', async () => {
      const { store, saved } = deps();
      const res = await handleLead(req({ ...body, loadedAt: Date.now() - 500 }), { store, notify: async () => {} });
      expect(res.status).toBe(200);
      expect(saved).toHaveLength(0);
    });
    test('нет метки времени: заявки нет', async () => {
      const { store, saved } = deps();
      await handleLead(req({ ...body, loadedAt: undefined }), { store, notify: async () => {} });
      expect(saved).toHaveLength(0);
    });
    test('капча не пройдена: 403, заявки нет', async () => {
      const { store, saved } = deps();
      const res = await handleLead(req(body), { store, notify: async () => {}, verifyHuman: async () => false });
      expect(res.status).toBe(403);
      expect(saved).toHaveLength(0);
    });
    test.each(['+375 (29) 111-11-11', '+375 (29) 234-56-78', '+375 (29) 121-21-21'])('фейковый номер %s: заявки нет', async (phone) => {
      const { store, saved } = deps();
      await handleLead(req({ ...body, phone }), { store, notify: async () => {} });
      expect(saved).toHaveLength(0);
    });
    test.each(['Купите на http://spam.ru', 'пишите spam.xyz', 'казино онлайн'])('спам в комментарии «%s»: заявки нет', async (comment) => {
      const { store, saved } = deps();
      await handleLead(req({ ...body, comment }), { store, notify: async () => {} });
      expect(saved).toHaveLength(0);
    });
    test('потолок 30 заявок в час: 31-я отклонена, алерт один раз', async () => {
      const { store, saved } = deps();
      const alerts: string[] = [];
      const d = { store, notify: async () => {}, alert: async (t: string) => { alerts.push(t); } };
      let last = 0;
      for (let i = 0; i < 33; i++) last = (await handleLead(req({ ...body, phone: `+37529${String(1000000 + i * 7919).slice(0, 7)}`.replace(/(\d)\1{5}/, '$1') }), d)).status;
      expect(saved.length).toBeLessThanOrEqual(30);
      expect(last).toBe(429);
      expect(alerts).toHaveLength(1);
    });
  });
});
