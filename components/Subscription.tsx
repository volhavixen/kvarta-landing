import { FREE_DELIVERY_FROM, SUB_PRICE } from '@/lib/content';
import { Calc } from './Calc';

export function Subscription() {
  return (
    <section className="subscription" id="subscription">
      <div className="w subscription-grid">
        <div className="sub-offer">
          <h2>Подписка:<br />две пачки каждый месяц.<br />Без&nbsp;нового заказа.</h2>
          <div className="sub-price">{SUB_PRICE} <small>BYN / месяц</small></div>
          <a className="btn" href="#form" data-pick-type="subscription">Оформить подписку</a>
        </div>
        <Calc />
        <div className="sub-benefits">
          <div><strong>2 × 250 г</strong><span>Выберите два сорта</span></div>
          <div><strong>Бесплатная доставка от {FREE_DELIVERY_FROM} BYN</strong><span>По Минску в пятницу</span></div>
          <div><strong>Один звонок</strong><span>Уточним детали заказа</span></div>
        </div>
      </div>
    </section>
  );
}
