'use client';

import { useEffect, useRef, useState } from 'react';
import { CONTACT } from '@/lib/content';
import { callbackText } from '@/lib/callback';
import { readAttribution } from '@/lib/attribution';
import { checkPhone, formatPhone, normalizePhone } from '@/lib/phone';
import { RoastLong, type RoastInfo } from './RoastDate';

type State = 'idle' | 'loading' | 'success' | 'error';
type Done = { name: string; phone: string; callback: string };

export function LeadForm({ roast }: { roast: RoastInfo }) {
  const [state, setState] = useState<State>('idle');
  const [type, setType] = useState('subscription');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [done, setDone] = useState<Done | null>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const busy = useRef(false);

  useEffect(() => {
    try {
      readAttribution(sessionStorage, location.search, document.referrer, location.pathname);
    } catch {}
  }, []);

  // Кнопки выше по странице предвыбирают тип заявки и подставляют сорт.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element).closest<HTMLElement>('[data-pick-type]');
      if (!el) return;
      setType(el.dataset.pickType ?? 'subscription');
      const note = el.dataset.pickNote;
      if (note) setComment((c) => c || `Интересует: ${note}`);
      if (el.tagName !== 'A') document.getElementById('form')?.scrollIntoView({ behavior: 'smooth' });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const onPhone = (v: string) => {
    const formatted = formatPhone(normalizePhone(v));
    setPhone(formatted);
    if (phoneError) setPhoneError(checkPhone(formatted));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy.current) return;
    const msg = checkPhone(phone);
    if (msg) {
      setPhoneError(msg);
      phoneRef.current?.focus();
      return;
    }
    busy.current = true;
    setState('loading');
    let source = {};
    try {
      source = readAttribution(sessionStorage, location.search, document.referrer, location.pathname);
    } catch {}
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, phone, type, comment, source }),
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(String(res.status));
      setDone({ name: name.trim(), phone, callback: callbackText(new Date()) });
      setState('success');
    } catch {
      setState('error');
    } finally {
      busy.current = false;
    }
  }

  const reset = () => {
    setName(''); setPhone(''); setComment(''); setType('subscription'); setPhoneError(''); setDone(null);
    setState('idle');
  };

  return (
    <section className="order" id="form">
      <div className="w form-grid">
        <div className="form-copy">
          <h2>Оставьте номер.<br />Остальное уточним.</h2>
          <p>Перезвоним, уточним сорт, количество и адрес.</p>
          <ul className="form-points">
            <li>Оплата на сайте не нужна</li>
            <li>Подписку можно оформить за один звонок</li>
            <li>Ближайшая обжарка: <RoastLong initial={roast} /></li>
          </ul>
        </div>
        <form onSubmit={submit} noValidate data-state={state}>
          {(state === 'idle' || state === 'loading') && (
            <div>
              <div className="field">
                <label htmlFor="lead-name">Имя</label>
                <input id="lead-name" type="text" name="name" autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
              </div>
              <div className="field">
                <label htmlFor="lead-phone">Телефон</label>
                <input
                  id="lead-phone" ref={phoneRef} type="tel" name="phone" inputMode="tel" autoComplete="tel"
                  placeholder="+375 (29) 123-45-67" value={phone}
                  className={phoneError ? 'is-invalid' : undefined}
                  aria-invalid={phoneError ? 'true' : 'false'} aria-describedby="lead-phone-hint lead-phone-error"
                  onChange={(e) => onPhone(e.target.value)}
                  onBlur={() => phone && setPhoneError(checkPhone(phone))}
                />
                <p className="hint" id="lead-phone-hint">Только белорусский номер.</p>
                <p className="err" id="lead-phone-error" role="alert" hidden={!phoneError}>{phoneError}</p>
              </div>
              <div className="field">
                <span className="label">Что вас интересует</span>
                <div className="choices">
                  {[['subscription', 'Подписка'], ['once', 'Разовый заказ'], ['question', 'Вопрос']].map(([v, l]) => (
                    <label key={v}>
                      <input type="radio" name="type" value={v} checked={type === v} onChange={() => setType(v)} />
                      <span>{l}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="field">
                <label htmlFor="lead-comment">Комментарий</label>
                <textarea id="lead-comment" name="comment" placeholder="Например: нужен кофе для фильтра" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} />
              </div>
              <button className="btn submit" type="submit" disabled={state === 'loading'}>
                {state === 'loading' ? 'Отправляем…' : 'Оставить заявку'}
              </button>
            </div>
          )}
          {state === 'success' && done && (
            <div className="success" role="status">
              <span className="mono">Заявка принята</span>
              <h3>Спасибо{done.name ? `, ${done.name}` : ''}.</h3>
              <p>Перезвоним на <b>{done.phone}</b> {done.callback}</p>
              <button type="button" className="btn plain" onClick={reset}>Отправить ещё одну</button>
            </div>
          )}
          {state === 'error' && (
            <div className="failure" role="alert">
              <h3>Заявка не отправилась</h3>
              <p>Попробуйте ещё раз или свяжитесь с нами напрямую.</p>
              <p><b>{CONTACT.phone}</b><br />{CONTACT.address}</p>
              <button type="button" className="btn" onClick={() => setState('idle')}>Повторить</button>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
