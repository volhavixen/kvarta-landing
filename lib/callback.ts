import { CONTACT } from './content';
import { minskParts } from './roast';

const hoursFor = (dow: number) => (dow === 0 || dow === 6 ? CONTACT.hours.weekend : CONTACT.hours.weekdays);

export function callbackText(now: Date): string {
  const p = minskParts(now);
  const h = p.h + p.min / 60;
  const [open, close] = hoursFor(p.dow);
  if (h >= open && h < close - 0.5) return 'в течение 30 минут: сейчас мастерская работает.';
  if (h < open) return `сегодня после ${open}:00.`;
  return `завтра после ${hoursFor((p.dow + 1) % 7)[0]}:00.`;
}
