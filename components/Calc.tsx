'use client';

import { useState } from 'react';
import { COFFEES } from '@/lib/content';
import { compareSubscription } from '@/lib/calc';

export function Calc() {
  const [a, setA] = useState(COFFEES[0].price);
  const [b, setB] = useState(COFFEES[1].price);
  const r = compareSubscription(a, b);
  const sign = r.diff > 0 ? '−' : r.diff < 0 ? '+' : '';
  const options = COFFEES.map((c) => <option key={c.id} value={c.price}>{c.region} · {c.price} BYN</option>);
  return (
    <div className="calc" data-calc-state={r.state}>
      <h3>Сравните с разовым заказом</h3>
      <div className="calc-fields">
        <label>Первая пачка<select value={a} onChange={(e) => setA(+e.target.value)}>{options}</select></label>
        <label>Вторая пачка<select value={b} onChange={(e) => setB(+e.target.value)}>{options}</select></label>
      </div>
      <div className="calc-res">
        <div><b>{r.once}</b><span>BYN разово</span></div>
        <div><b>{r.sub}</b><span>BYN подписка</span></div>
        <div><b data-calc-diff>{sign}{Math.abs(r.diff)}</b><span>BYN разница</span></div>
      </div>
      <p data-calc-note aria-live="polite">{r.note}</p>
    </div>
  );
}
