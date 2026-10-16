import { BatchLabel, type RoastInfo } from './RoastDate';

export function Hero({ roast }: { roast: RoastInfo }) {
  return (
    <div className="w">
      <section className="hero" style={{ border: 0 }}>
        <div>
          <h1>Свежая обжарка.<br /><em>Каждую неделю.</em></h1>
          <div className="hero-actions">
            <a className="btn" href="#form" data-pick-type="subscription">Оставить заявку</a>
            <small>Менеджер перезвонит и оформит подписку или разовый заказ.</small>
          </div>
        </div>
        <div className="pack-scene" aria-label="Этикетка ближайшей партии">
          <BatchLabel initial={roast} />
        </div>
      </section>
      <div className="route" aria-label="Путь кофе от обжарки до клиента">
        <div><span>Четверг</span><strong>Обжариваем</strong><small>Партиями по 5 кг</small></div>
        <div><span>Пятница</span><strong>Доставляем</strong><small>По Минску</small></div>
        <div><span>Выходные</span><strong>Вы завариваете</strong><small>Кофе из свежей партии</small></div>
      </div>
    </div>
  );
}
