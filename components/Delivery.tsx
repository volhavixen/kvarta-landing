import { CONTACT, FREE_DELIVERY_FROM } from '@/lib/content';

export function Delivery() {
  return (
    <section id="delivery">
      <div className="w">
        <div className="section-head section-head-single"><h2>Доставка<br />и самовывоз</h2></div>
        <div className="delivery-layout">
          <div className="delivery-cards">
            <article><h3>Доставка</h3><p>Доставка в пятницу. От {FREE_DELIVERY_FROM} BYN бесплатно, меньше: стоимость назовёт менеджер.</p></article>
            <article><h3>Самовывоз</h3><p>{CONTACT.address}. Мастерская, не магазин: лучше предупредить о визите по телефону.</p></article>
          </div>
          <aside className="work-hours">
            <h3>Часы работы мастерской</h3>
            <div><strong>пн–пт</strong><span>{CONTACT.hours.weekdays[0]}:00–{CONTACT.hours.weekdays[1]}:00</span></div>
            <div><strong>сб–вс</strong><span>{CONTACT.hours.weekend[0]}:00–{CONTACT.hours.weekend[1]}:00</span></div>
          </aside>
        </div>
      </div>
    </section>
  );
}
