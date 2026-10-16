const CODES = ['25', '29', '33', '44', '17'];

export function normalizePhone(raw: string): string {
  let d = String(raw).replace(/\D/g, '');
  if (d.startsWith('375')) d = d.slice(3);
  else if (d.startsWith('80')) d = d.slice(2);
  return d.slice(0, 9);
}

export function formatPhone(national: string): string {
  if (!national) return '';
  let s = '+375 (' + national.slice(0, 2);
  if (national.length >= 2) s += ')';
  if (national.length > 2) s += ' ' + national.slice(2, 5);
  if (national.length > 5) s += '-' + national.slice(5, 7);
  if (national.length > 7) s += '-' + national.slice(7, 9);
  return s;
}

export function checkPhone(raw: string): string {
  const n = normalizePhone(raw);
  if (!n) return 'Введите номер, чтобы менеджер мог перезвонить.';
  if (n.length >= 2 && !CODES.includes(n.slice(0, 2))) {
    return `Код «${n.slice(0, 2)}» не белорусский. Мобильные у нас начинаются с 25, 29, 33 или 44.`;
  }
  if (n.length < 9) {
    const left = 9 - n.length;
    return `Не хватает ${left} ${left === 1 ? 'цифры' : 'цифр'}. Номер выглядит так: +375 29 123-45-67.`;
  }
  return '';
}

export function toE164(raw: string): string {
  return '+375' + normalizePhone(raw);
}
