export const SUB_PRICE = 54;
export const FREE_DELIVERY_FROM = 50;

export const CONTACT = {
  phone: '+375 29 000-00-00',
  address: 'Минск, ул. Короля, 9',
  hours: {
    weekdays: [8, 20] as [number, number],
    weekend: [10, 18] as [number, number],
  },
};

export type Coffee = {
  id: 'ethiopia' | 'colombia' | 'brazil';
  region: string;
  name: string;
  roast: string;
  weight: string;
  price: number;
  tastes: { label: string; tone: string }[];
};

export const COFFEES: Coffee[] = [
  { id: 'ethiopia', region: 'Эфиопия', name: 'Иргачеффе', roast: 'светлая обжарка', weight: '250 г', price: 32,
    tastes: [{ label: 'цветочный', tone: 'floral' }, { label: 'бергамот', tone: 'citrus' }] },
  { id: 'colombia', region: 'Колумбия', name: 'Уила', roast: 'средняя обжарка', weight: '250 г', price: 29,
    tastes: [{ label: 'карамель', tone: 'caramel' }, { label: 'красное яблоко', tone: 'apple' }] },
  { id: 'brazil', region: 'Бразилия', name: 'Серрадо', roast: 'эспрессо', weight: '250 г', price: 26,
    tastes: [{ label: 'орех', tone: 'nut' }, { label: 'шоколад', tone: 'choc' }] },
];

export const DRIP = { region: 'Кофе в дрип-пакетах', note: 'ассорти · 10 шт.', name: 'Для офиса и дороги', text: 'Кружка и кипяток — больше ничего', price: 18 };
