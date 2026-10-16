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

const body = { name: 'Аня', phone: '+375 (29) 123-45-67', type: 'once', comment: '', source: { page: '/' } };
const req = (b: unknown, raw?: string) =>
  new Request('http://x/api/lead', { method: 'POST', body: raw ?? JSON.stringify(b), headers: { 'content-type': 'application/json' } });

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
    const res = await handleLead(req({ ...body, phone: '80291234567' }), deps);
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
});
