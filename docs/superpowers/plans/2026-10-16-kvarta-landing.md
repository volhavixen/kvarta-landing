# Лендинг «Кварта» — план реализации

> **Для исполнителя:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (рекомендуется) или superpowers:executing-plans. Шаги — чекбоксы `- [ ]`.

**Goal:** Перенести утверждённый макет `mockups/combined.html` в Next.js-лендинг с рабочей формой заявки (валидация BY-номера, защита от дублей 10 мин, UTM, Telegram-дубль, видимый сбой) и замером Lighthouse mobile.

**Architecture:** Один статический маршрут `/` из серверных компонентов + два клиентских острова (калькулятор подписки, форма). Бизнес-логика (телефон, дата обжарки, расчёт, время звонка, дедуп) — чистые функции в `lib/` с юнит-тестами, портированные из `mockups/common.js`. Один маршрут `POST /api/lead`: валидация → Upstash `SET NX EX 600` → Telegram (best-effort).

**Tech Stack:** Next.js (App Router, TypeScript), Upstash Redis (`@upstash/redis`), Telegram Bot API, Vitest, Playwright (один smoke), Vercel (free).

**Spec:** `../../../../kvarta-brief.pdf` (4 стр., прочитан и сверен) + `../../../PRODUCT.md` (выжимка фактов). Макет: `mockups/combined.html`, логика: `mockups/common.js`, обоснование: `mockups/README.md`.

## Global Constraints

- Макет `combined.html` — источник дизайна: токены (`--paper:#f3ecdf`, `--light:#fffaf1`, `--ink:#211b18`, `--rust:#a43e26`, `--rust-dark:#762b1b`), шрифты DM Sans / DM Serif Display / IBM Plex Mono, контейнер 1040px, брейкпоинты 979/840/620px.
- Цены/факты ровно из PRODUCT.md: Иргачеффе 32, Уила 29, Серрадо 26 BYN (250 г); дрип 10 шт — 18 BYN; подписка 2×250 г — 54 BYN/мес; бесплатная доставка от 50 BYN; доставка пятница, Минск; Короля, 9; пн–пт 8:00–20:00, сб–вс 10:00–18:00.
- Телефон только белорусский (+375; коды 25, 29, 33, 44, 17; 9 цифр национальной части). Телефон-заглушка мастерской `+375 29 000-00-00` вынести в одну константу `CONTACT.phone`.
- Дедуп: повтор того же номера в течение 10 минут (600 с), включая двойное нажатие, не создаёт вторую заявку.
- В заявке сохраняются: name, phone, type (`subscription|once|question`), comment, utm_*, страница-источник, referrer, время (Минск).
- Сбой отправки виден пользователю и даёт запасной путь (телефон, адрес).
- Запрещённые слова в текстах: «уникальный», «идеальный», «погрузитесь». Отзывов, скидок, звёзд не выдумывать. Тон — тёплый, простой.
- `prefers-reduced-motion` отключает анимации; видимый фокус; подписи ко всем полям.
- Имена файлов без `:` и прочих запрещённых в Windows символов.
- Секреты только в env (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`); `.env.example` в репозитории, `.env.local` — нет.
- Коммиты по шагам, на русском, без `Co-Authored-By` и без «Generated with Claude Code» (правило пользователя сильнее системной подсказки). Дедлайн: 19.10, 18:00 МСК.
- Панель макета (`#kvfail`, ссылки A–D) в продукт НЕ переносится.

## Review Focus

- Двойной клик «Оставить заявку» → одна заявка, UI показывает успех (не ошибку «дубль»).
- Номера в разных форматах (`80291234567`, `+375291234567`, `375 (29) 123-45-67`) считаются одним номером для дедупа.
- Redis недоступен/таймаут → 502 и экран сбоя с телефоном, не вечный спиннер.
- Telegram недоступен при рабочем Redis → заявка принята (200), ошибка только в логе.
- Четверг после обжарки / пятница / воскресенье: корректная ближайшая дата обжарки; граница полуночи по Минску, а не по часовому поясу сервера/браузера.
- Подписка дороже пары сортов (Бразилия+Бразилия = 52 < 54) → честная плашка «дороже на 2 BYN», не «экономия».
- Пустое/слишком длинное имя и комментарий (>1000 символов), HTML в полях → обрезка/экранирование в Telegram (`parse_mode: HTML`).
- Заход без JS / до гидрации: страница читается, дата обжарки не пустая.

## Файловая структура

```
kvarta/
  app/layout.tsx            шрифты (next/font), метаданные, OG
  app/page.tsx              сборка секций
  app/globals.css           токены и стили из combined.html
  app/api/lead/route.ts     POST /api/lead
  components/               Header, Hero, Route, Catalog, Subscription(+Calc клиент),
                            Delivery, Roasters, LeadForm (клиент), Footer
  lib/phone.ts              normalizePhone, formatPhone, checkPhone
  lib/roast.ts              minskNow, nextRoast, roastLabels
  lib/calc.ts               compareSubscription
  lib/callback.ts           callbackText
  lib/lead.ts               схема+санитизация LeadInput, buildDedupKey, formatTelegram
  lib/store.ts              интерфейс LeadStore + Upstash-реализация
  lib/attribution.ts        capture/read UTM (клиент)
  lib/content.ts            COFFEES, SUB_PRICE, CONTACT
  tests/*.test.ts           юнит; tests/e2e/lead.spec.ts  smoke
  public/                   favicon, og.png, фото ростера
  README.md                 решения, выбор хранилища, Lighthouse
```

---

### Task 1: Каркас проекта

**Files:** Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `.env.example`, `.gitignore`, `app/layout.tsx`, `app/page.tsx`
**Interfaces:** Produces: скрипты `dev`, `build`, `test` (`vitest run --reporter=dot`), `typecheck`.

- [ ] **Step 1:** В `kvarta/` (существующий git-репозиторий) инициализировать Next.js (App Router, TS, без Tailwind, без src/); добавить `vitest`, `@upstash/redis`, `@playwright/test`. Папку `mockups/` оставить как есть.
- [ ] **Step 2:** `app/page.tsx` — заглушка `<main>Кварта</main>`. Выполнить `npm run build && npm test` → собирается, 0 тестов не падает (`passWithNoTests`).
- [ ] **Step 3:** `.env.example` с четырьмя переменными из Global Constraints; `.gitignore` содержит `.env*.local`.
- [ ] **Step 4:** Commit `Каркас Next.js и тестовое окружение`.

### Task 2: Телефон (lib/phone.ts)

**Files:** Create: `lib/phone.ts`, `tests/phone.test.ts`
**Interfaces:** Produces: `normalizePhone(raw: string): string` (национальные ≤9 цифр, срезает `375` и `80`); `formatPhone(national: string): string` → `+375 (29) 123-45-67`; `checkPhone(raw: string): string` — пустая строка = валидно, иначе текст подсказки (те же формулировки, что в `mockups/common.js`); `toE164(raw): string` → `+375291234567`.

- [ ] **Step 1: Тесты.** `normalizePhone('80291234567')==='291234567'`; `'+375 (29) 123-45-67'`→`'291234567'`; `checkPhone('')` содержит «Введите номер»; `checkPhone('+375 (22')` содержит «не белорусский»; `checkPhone('+375 (29) 123')` содержит «Не хватает 4 цифр»; `checkPhone('291234567')===''`; `toE164('80291234567')==='+375291234567'`.
- [ ] **Step 2:** Запустить — FAIL.
- [ ] **Step 3:** Портировать `national/fmt/checkPhone` из `mockups/common.js` в TS.
- [ ] **Step 4:** `npm test` → PASS. Commit `Проверка и форматирование белорусского номера`.

### Task 3: Дата обжарки и «когда перезвонят» (lib/roast.ts, lib/callback.ts)

**Files:** Create: `lib/roast.ts`, `lib/callback.ts`, `tests/roast.test.ts`, `tests/callback.test.ts`
**Interfaces:** Produces: `minskParts(now: Date): {y,m,d,h,min,dow}` (через `Intl` `Europe/Minsk`); `roastLabels(now: Date): {dm, long, fridm, batchNum, whenWord}`; `callbackText(now: Date): string`.

- [ ] **Step 1: Тесты roast** (передавать `Date` в UTC, ожидаемое — по Минску, UTC+3): среда 2026-10-21 12:00Z → обжарка `22.10`, пятница `23.10`, `batchNum` `43-26`; четверг 2026-10-22 10:00Z → `22.10`, `whenWord==='сегодня'`; пятница 2026-10-23 → `29.10`; граница: 2026-10-21 21:30Z (= 00:30 четверга по Минску) → `22.10`, `whenWord==='сегодня'`.
- [ ] **Step 2: Тесты callback:** будни 10:00 Минска → «в течение 30 минут…»; будни 19:45 → «завтра после 8:00.»; суббота 09:00 → «сегодня после 10:00.»; пятница 21:00 → «завтра после 10:00.».
- [ ] **Step 3:** Запустить — FAIL. Реализовать (логика из `common.js`, но без зависимости от локали браузера). Часы работы брать из `CONTACT.hours` (Task 4 создаёт `lib/content.ts`; если задача идёт раньше — создать файл здесь с `CONTACT`).
- [ ] **Step 4:** PASS. Commit `Расчёт даты обжарки и времени звонка`.

### Task 4: Контент и расчёт подписки (lib/content.ts, lib/calc.ts)

**Files:** Create: `lib/content.ts`, `lib/calc.ts`, `tests/calc.test.ts`
**Interfaces:** Produces: `COFFEES` (id, region, name, roast, weight, price, tastes[]) — 3 сорта + `DRIP`; `SUB_PRICE=54`; `FREE_DELIVERY_FROM=50`; `CONTACT {phone, address, hours}`; `compareSubscription(a:number,b:number): {once:number, sub:number, diff:number, state:'save'|'same'|'more', note:string}` (diff>0 = экономия).

- [ ] **Step 1: Тесты:** (32,29) → once 61, diff 7, state save, note содержит «84 BYN за год»; (26,26) → diff −2, state more, note содержит «дороже на 2 BYN»; (29,25) нет такого — состояние `same` проверить на синтетических (27,27) → diff 0 (в реальном прайсе такой пары нет).
- [ ] **Step 2:** FAIL → реализовать, тексты примечаний взять из `common.js` (без выдуманных цифр). → PASS.
- [ ] **Step 3:** Commit `Данные каталога и честный расчёт подписки`.

### Task 5: Заявка: схема, ключ дедупа, Telegram-текст (lib/lead.ts)

**Files:** Create: `lib/lead.ts`, `tests/lead.test.ts`
**Interfaces:** Produces: `parseLead(body: unknown): {ok:true, lead:Lead} | {ok:false, field:'phone'|'type'|'body', message:string}`; `Lead {name, phone(E.164), type, comment, source:{page,referrer,utm_source,utm_medium,utm_campaign,utm_content,utm_term}, createdAt:string}`; `dedupKey(phoneE164:string): string` → `lead:+375…`; `formatTelegram(lead: Lead): string` (HTML, экранированный).

- [ ] **Step 1: Тесты:** неверный код (`+375221234567`) → `ok:false, field:'phone'`; `type:'x'` → `field:'type'`; имя обрезается до 80, комментарий до 1000; `name:'<b>x</b>'` в `formatTelegram` → `&lt;b&gt;`; разные форматы одного номера дают равный `dedupKey`; в Telegram-тексте есть utm_campaign и page.
- [ ] **Step 2:** FAIL → реализовать (использует `checkPhone`, `toE164`). PASS.
- [ ] **Step 3:** Commit `Валидация заявки и текст для менеджера`.

### Task 6: Хранилище и API (lib/store.ts, app/api/lead/route.ts)

**Files:** Create: `lib/store.ts`, `app/api/lead/route.ts`, `tests/api-lead.test.ts`
**Interfaces:** Consumes: Task 5. Produces: `interface LeadStore { claim(key:string, ttlSec:number): Promise<boolean>; save(lead:Lead): Promise<void> }`; `createStore(): LeadStore` (Upstash: `SET key 1 NX EX 600`, затем `LPUSH leads <json>`); `handleLead(req: Request, deps:{store:LeadStore, notify:(l:Lead)=>Promise<void>, now?:()=>Date}): Promise<Response>`; `POST` = `handleLead` с реальными deps. Ответы: 200 `{ok:true}`; 200 `{ok:true,duplicate:true}`; 400 `{ok:false,field,message}`; 502 `{ok:false}`.

- [ ] **Step 1: Тесты с fake store:** валидная → 200, `save` и `notify` по разу; две подряд с одним номером (разные форматы) → вторая 200 `duplicate:true`, `save` всё ещё 1; `claim` бросает → 502; `notify` бросает → 200 и заявка сохранена; неверный номер → 400; не-JSON → 400.
- [ ] **Step 2:** FAIL → реализовать. Порядок: parse → claim → (если не новый, вернуть duplicate) → save (при ошибке `release` ключа не нужен, но вернуть 502 и удалить ключ, чтобы клиент мог повторить) → notify в try/catch. Telegram: `fetch` `sendMessage` с таймаутом 3 с; без токена — пропуск без ошибки.
- [ ] **Step 3:** PASS. Ручная проверка с реальными Upstash/Telegram — Task 12.
- [ ] **Step 4:** Commit `API заявок: дедуп на 10 минут, Redis и Telegram`.

### Task 7: Стили и каркас страницы из макета

**Files:** Create: `app/globals.css`, `components/Header.tsx`, `Hero.tsx`, `Route.tsx`, `Footer.tsx`; Modify: `app/layout.tsx`, `app/page.tsx`

- [ ] **Step 1:** Слить итоговые CSS-слои `combined.html` в один `globals.css` (учитывать порядок каскада; убрать мёртвое: `.mini-pack`, `.drip-stack`, `.pack*`, стили панели). `next/font` для трёх шрифтов вместо Google `<link>`; `lang="ru"`.
- [ ] **Step 2:** Шапка, Hero (этикетка партии с `RoastLabel`), полоса «Четверг/Пятница/Выходные», футер. Дата обжарки: серверный рендер из `roastLabels(new Date())` + `export const revalidate = 600`, и клиентский `RoastLabel` пересчитывает на маунте (чтобы не залипала). Без `data-roast`-скрипта.
- [ ] **Step 3:** Сравнить 3 ширины (1280, 768, 390) со скриншотами `combined.html` вручную (`npm run dev`, DevTools). Критерий: нет горизонтального скролла, блоки соответствуют макету.
- [ ] **Step 4:** Commit `Каркас страницы по макету: шапка, hero, футер`.

### Task 8: Каталог, доставка, «Кто обжаривает»

**Files:** Create: `components/Catalog.tsx`, `Delivery.tsx`, `Roasters.tsx`

- [ ] **Step 1:** Каталог из `COFFEES` (карточки + дрип; цвета карточек, вкусовые чипы). Кнопка «Заказать» вызывает `pickType('once', note)` из Task 10 (пока — якорь `#form`).
- [ ] **Step 2:** Доставка/самовывоз/часы из `CONTACT`; текст про стоимость <50 BYN: «назовёт менеджер» (допущение, зафиксировать в README).
- [ ] **Step 3:** Фото ростера: заменить заглушку на `next/image` (Unsplash/Pexels, не «латте-арт на дереве»; лицензия и автор — в README; размеры заданы, `priority` не ставить). Если подходящего фото нет к дедлайну — оставить заглушку-плашку из макета, пометить в README.
- [ ] **Step 4:** Commit `Каталог, доставка, блок про обжарщиков`.

### Task 9: Подписка и калькулятор

**Files:** Create: `components/Subscription.tsx`, `components/Calc.tsx` ("use client")
**Interfaces:** Consumes: `compareSubscription`, `COFFEES`.

- [ ] **Step 1:** Calc: два `select` (по умолчанию Эфиопия и Колумбия), три числа, плашка `data-state` save/same/more, `aria-live="polite"` на примечании.
- [ ] **Step 2:** Проверить вручную пары (32,29) → «−7», (26,26) → «+2» и текст «дороже». Commit `Подписка с честным калькулятором`.

### Task 10: Форма заявки и источник

**Files:** Create: `components/LeadForm.tsx` ("use client"), `lib/attribution.ts`, `lib/pick.ts`; Modify: Catalog/Subscription/Header/Hero (кнопки)
**Interfaces:** Produces: `captureAttribution(): void` (при первом заходе пишет в `sessionStorage` utm_*, referrer, landing path; не перезаписывает); `readAttribution(): Source`; `pickType(type, note?)` — через `CustomEvent('kv:pick')`, форма предвыбирает радио и подставляет «Интересует: …» в пустой комментарий, скроллит к `#form`.

- [ ] **Step 1: Тест (vitest, jsdom не нужен — функции принимают `Storage`/`URLSearchParams`):** `readAttribution` из `?utm_source=ig&utm_campaign=oct` содержит оба; повторный вызов с другим URL не перезаписывает первый.
- [ ] **Step 2:** LeadForm: состояния `idle|loading|success|error`; маска и валидация через `lib/phone`; ошибка телефона по `blur`/`submit` с `aria-describedby`, фокус на поле; защита от двойного нажатия (`state==='loading'` + `disabled`); `fetch('/api/lead')` с таймаутом 10 с; `duplicate:true` показывается как успех; сеть/502/таймаут → экран сбоя с `CONTACT.phone`, адресом и «Повторить»; успех: «Спасибо, {имя}», номер, `callbackText(new Date())`.
- [ ] **Step 3:** Вручную: пустой номер, `+375 22…`, неполный, валидный; быстрый двойной клик → в Network один запрос. Commit `Форма заявки: валидация, источник, состояния`.

### Task 11: Доступность, метаданные, анимации

**Files:** Modify: `app/layout.tsx`, `app/globals.css`; Create: `public/og.png`, `app/icon.*`

- [ ] **Step 1:** `<title>`, description, Open Graph/Twitter-превью (`og.png` 1200×630 в стиле этикетки), favicon. Проверить превью локально через `metadata` в HTML.
- [ ] **Step 2:** Фокус-кольца, контраст ≥4.5:1 (проверить плашки таксономии вкуса и текст на ржавом фоне), `prefers-reduced-motion`, один skip-link. Анимации — только уместные (hover карточек, плавный скролл), без новых зависимостей.
- [ ] **Step 3:** Commit `Метаданные, превью ссылки, доступность`.

### Task 12: E2E-смоук, деплой, Lighthouse, README

**Files:** Create: `tests/e2e/lead.spec.ts`, `playwright.config.ts`, обновить `README.md`

- [ ] **Step 1: E2E** (Playwright, mobile viewport 390×844, API подменён `page.route`): неверный номер → видна подсказка, запроса нет; валидный → экран «Спасибо»; ответ 502 → блок «Заявка не отправилась» с `+375 29 000-00-00`; двойной клик → ровно 1 запрос. Запуск: `npx playwright test --reporter=line` → PASS.
- [ ] **Step 2:** Создать Upstash Redis (free), Telegram-бота и чат; задать 4 env в Vercel; деплой (`vercel --prod`). Ручная проверка на проде: заявка → пришло в Telegram с utm и страницей; повтор того же номера <10 мин → второй заявки в Redis/Telegram нет.
- [ ] **Step 3:** Lighthouse mobile на проде (`npx lighthouse <url> --form-factor=mobile --only-categories=performance,accessibility,best-practices,seo`). Целевое: Performance ≥90, A11y ≥95. Что ниже — исправить (шрифты `display:swap`, размеры изображений) и перемерить; итог и скриншот в `docs/lighthouse/` (имена без `:`).
- [ ] **Step 4: README** — вести в существующем `kvarta/README.md` (корень репозитория), не создавать новый; текущие строки про макет сохранить, ссылку на `mockups/README.md` оставить. Заготовку разделов завести сразу в Task 1 и дополнять по ходу задач. (бриф п.05: «на полстраницы», честный, по-русски). Обязательные разделы: что делали сами, а что ИИ; **где ИИ ошибся и как это заметили** (вести заметки по ходу задач, не восстанавливать задним числом); что не успели или сделали иначе; допущения (бриф: «просто запишите допущение в README»). Дополнительно: стек; почему Upstash Redis (атомарный `SET NX EX` = дедуп без своей БД, free-tier Vercel/Upstash, TTL из коробки) и Telegram как дубль; как запустить; допущения (обжарка Колумбии — средняя, Бразилии — средне-тёмная; сорта подписки выбирает клиент; доставка <50 BYN уточняет менеджер; телефон-заглушка); лицензия фото; результаты Lighthouse; как управлял ИИ (ссылки на коммиты, лог сессии); что не сделано.
- [ ] **Step 5: Пакет к отправке** (бриф п.05, одним сообщением до 19.10 18:00 МСК): 1) ссылка на живой сайт; 2) ссылка на публичный репозиторий, коммиты по шагам (не один в конце); 3) лог ИИ — `/export` сессии Claude Code в `docs/ai-log/` (имя без `:`); 4) скриншот/отчёт Lighthouse mobile; 5) README.
- [ ] **Step 6:** Проверить имена файлов на запрещённые символы (`git ls-files | grep -E '[:*?"<>|\\]'` → пусто), `npm run typecheck && npm test && npm run build`. Commit `E2E, деплой и README`.

---

## Self-review

- Покрытие PRODUCT.md: ассортимент/цены (T4, T8), подписка и честный расчёт (T4, T9), живая дата обжарки (T3, T7), форма/BY-номер/дедуп/UTM/сбой (T2, T5, T6, T10), Telegram и превью (T6, T11), Lighthouse mobile и README с обоснованием хранилища (T12), a11y/reduced-motion (T11).
- Типы согласованы: `Lead`, `LeadStore`, `Source`, `compareSubscription`, `checkPhone`/`toE164` определены до использования.
- Сверка с PDF выполнена: все «обязательно» (кто они и почему свежесть, ассортимент с ценами, подписка, доставка/самовывоз, контакты, форма), требования к форме/бэкенду, «плюсы» и пакет к отправке покрыты. Добавлено после сверки: пакет к отправке и обязательные разделы README (T12).
