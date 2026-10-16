import { expect, test } from '@playwright/test';

async function fill(page: import('@playwright/test').Page, phone: string) {
  await page.goto('/');
  await page.getByLabel('Имя').fill('Аня');
  await page.getByLabel('Телефон').fill(phone);
}
const submit = (page: import('@playwright/test').Page) => page.getByRole('button', { name: /Оставить заявку|Отправляем/ }).last();

test('неверный номер: подсказка, запроса нет', async ({ page }) => {
  let requests = 0;
  await page.route('**/api/lead', (r) => { requests++; r.fulfill({ json: { ok: true } }); });
  await fill(page, '22123');
  await submit(page).click();
  await expect(page.locator('#lead-phone-error')).toContainText('не белорусский');
  expect(requests).toBe(0);
});

test('валидный номер: экран «Заявка принята»', async ({ page }) => {
  await page.route('**/api/lead', (r) => r.fulfill({ json: { ok: true } }));
  await fill(page, '291234567');
  await submit(page).click();
  await expect(page.getByText('Заявка принята')).toBeVisible();
  await expect(page.getByText('+375 (29) 123-45-67')).toBeVisible();
});

test('ответ 502: экран сбоя с телефоном', async ({ page }) => {
  await page.route('**/api/lead', (r) => r.fulfill({ status: 502, json: { ok: false } }));
  await fill(page, '291234567');
  await submit(page).click();
  await expect(page.getByText('Заявка не отправилась')).toBeVisible();
  await expect(page.locator('.failure').getByText('+375 29 000-00-00')).toBeVisible();
});

test('двойной клик: ровно один запрос', async ({ page }) => {
  let requests = 0;
  await page.route('**/api/lead', async (r) => {
    requests++;
    await new Promise((res) => setTimeout(res, 500));
    r.fulfill({ json: { ok: true } });
  });
  await fill(page, '291234567');
  await submit(page).dblclick();
  await expect(page.getByText('Заявка принята')).toBeVisible();
  expect(requests).toBe(1);
});
