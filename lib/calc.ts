import { FREE_DELIVERY_FROM, SUB_PRICE } from './content';

export type CalcResult = { once: number; sub: number; diff: number; state: 'save' | 'same' | 'more'; note: string };

export function compareSubscription(a: number, b: number): CalcResult {
  const once = a + b;
  const diff = once - SUB_PRICE;
  const state = diff > 0 ? 'save' : diff < 0 ? 'more' : 'same';
  const note =
    state === 'save'
      ? `Экономия ${diff} BYN в месяц — ${diff * 12} BYN за год. Бесплатная доставка действует для заказов от ${FREE_DELIVERY_FROM} BYN; стоимость доставки меньшего заказа уточнит менеджер.`
      : state === 'same'
        ? 'Цена одинаковая. Разница в том, что заказывать каждый месяц заново не нужно.'
        : `С этой парой подписка дороже на ${-diff} BYN: цена у неё одна на любые сорта. Выгода здесь только в том, что не нужно каждый месяц оформлять заказ.`;
  return { once, sub: SUB_PRICE, diff, state, note };
}
