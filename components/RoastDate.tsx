'use client';

import { useEffect, useState } from 'react';
import { roastLabels } from '@/lib/roast';

export type RoastInfo = ReturnType<typeof roastLabels>;

/** Серверный рендер даёт стартовое значение, на клиенте пересчитываем по Минску. */
export function useRoast(initial: RoastInfo): RoastInfo {
  const [info, setInfo] = useState(initial);
  useEffect(() => setInfo(roastLabels(new Date())), []);
  return info;
}

export function RoastLong({ initial }: { initial: RoastInfo }) {
  return <>{useRoast(initial).long}</>;
}

export function BatchLabel({ initial }: { initial: RoastInfo }) {
  const r = useRoast(initial);
  return (
    <div className="batch-label">
      <div className="batch-stamp">
        <span>обжарка</span>
        <b>{r.dm}</b>
        <span>чт</span>
      </div>
      <p className="batch-number mono">Партия {r.batchNum}</p>
      <strong>Ближайшая<br />партия</strong>
      <dl>
        <div><dt>Дата обжарки</dt><dd>{r.long}</dd></div>
        <div><dt>Вес партии</dt><dd>5 кг</dd></div>
        <div><dt>Доставка</dt><dd>{r.fridm}, пт</dd></div>
      </dl>
    </div>
  );
}
