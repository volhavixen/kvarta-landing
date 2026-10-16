import { describe, expect, test } from 'vitest';
import { checkPhone, formatPhone, normalizePhone, toE164 } from '@/lib/phone';

describe('phone', () => {
  test('normalizePhone срезает 80 и 375', () => {
    expect(normalizePhone('80291234567')).toBe('291234567');
    expect(normalizePhone('+375 (29) 123-45-67')).toBe('291234567');
  });
  test('checkPhone: пустой номер', () => {
    expect(checkPhone('')).toContain('Введите номер');
  });
  test('checkPhone: не белорусский код', () => {
    expect(checkPhone('+375 (99')).toContain('не белорусский');
  });
  test('checkPhone: не хватает цифр', () => {
    expect(checkPhone('+375 (29) 123')).toContain('Не хватает 4 цифр');
  });
  test('checkPhone: валидный номер', () => {
    expect(checkPhone('291234567')).toBe('');
  });
  test('городской минский номер', () => {
    expect(checkPhone('172345678')).toBe('');
    expect(formatPhone('172345678')).toBe('+375 (17) 234-56-78');
    expect(checkPhone('+375 (162) 12-34-56')).toContain('не белорусский');
  });
  test('toE164', () => {
    expect(toE164('80291234567')).toBe('+375291234567');
  });
});
