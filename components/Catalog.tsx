import { COFFEES, DRIP } from '@/lib/content';

export function Catalog() {
  return (
    <section id="coffee">
      <div className="w">
        <div className="section-head section-head-single"><h2>Виды кофе</h2></div>
        <div className="catalog">
          {COFFEES.map((c) => (
            <article key={c.id} className={`coffee coffee-${c.id}`}>
              <div className="coffee-head"><span>{c.region}</span><span>{c.weight} · {c.roast}</span></div>
              <div className="coffee-body">
                <h3>{c.name}</h3>
                <p className="tastes">
                  {c.tastes.map((t) => <span key={t.label} className={`taste taste-${t.tone}`}>{t.label}</span>)}
                </p>
              </div>
              <div className="coffee-foot">
                <strong className="price">{c.price} BYN</strong>
                <button type="button" className="text-action" data-pick-type="once" data-pick-note={`${c.region} ${c.name}`}>Заказать</button>
              </div>
            </article>
          ))}
          <article className="coffee coffee-drip">
            <div className="coffee-head"><span>{DRIP.region}</span><span>{DRIP.note}</span></div>
            <div className="coffee-body"><h3>{DRIP.name}</h3><p>{DRIP.text}</p></div>
            <div className="coffee-foot">
              <strong className="price">{DRIP.price} BYN</strong>
              <button type="button" className="text-action" data-pick-type="once" data-pick-note="Кофе в дрип-пакетах, ассорти">Заказать</button>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
