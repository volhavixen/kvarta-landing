const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

export type MinskParts = { y: number; m: number; d: number; h: number; min: number; dow: number };

export function minskParts(now: Date): MinskParts {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Minsk', hour12: false, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric',
  }).formatToParts(now);
  const o: Record<string, number> = {};
  parts.forEach((p) => { if (p.type !== 'literal') o[p.type] = +p.value; });
  const dow = new Date(Date.UTC(o.year, o.month - 1, o.day)).getUTCDay();
  return { y: o.year, m: o.month, d: o.day, h: o.hour % 24, min: o.minute, dow };
}

const pad = (n: number) => (n < 10 ? '0' : '') + n;
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 864e5);
const dm = (d: Date) => `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}`;

function isoWeek(d: Date): number {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const y0 = Date.UTC(t.getUTCFullYear(), 0, 1);
  return Math.ceil(((t.getTime() - y0) / 864e5 + 1) / 7);
}

export function roastLabels(now: Date) {
  const p = minskParts(now);
  const today = new Date(Date.UTC(p.y, p.m - 1, p.d));
  const diff = (4 - p.dow + 7) % 7;
  const roast = addDays(today, diff);
  return {
    dm: dm(roast),
    long: `${roast.getUTCDate()} ${MONTHS[roast.getUTCMonth()]}`,
    fridm: dm(addDays(roast, 1)),
    fridLong: `${addDays(roast, 1).getUTCDate()} ${MONTHS[addDays(roast, 1).getUTCMonth()]}`,
    batchNum: `${pad(isoWeek(roast))}-${String(roast.getUTCFullYear()).slice(2)}`,
    whenWord: diff === 0 ? 'сегодня' : diff === 1 ? 'завтра' : 'в четверг',
  };
}
