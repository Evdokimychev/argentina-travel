# Tripster — Partner API, External Orders, prefilling checkout

## Официальная документация

| Раздел | URL |
|--------|-----|
| Каталог (Partner API NEW) | https://tripster.atlassian.net/wiki/spaces/affiliates/pages/3688235009 |
| Travelpayouts → раздел «API и данные экскурсий» | https://support.travelpayouts.com/hc/ru/sections/360004561331 |
| External Orders — API (общий workflow) | https://tripster.atlassian.net/wiki/spaces/PEO/pages/3035136001 |
| Авторизация (affiliate) | https://tripster.atlassian.net/wiki/spaces/affiliates/pages/3736502353 |
| Авторизация (External Orders) | https://tripster.atlassian.net/wiki/spaces/PEO/pages/3034841206 |
| Создание заказа | https://tripster.atlassian.net/wiki/spaces/PEO/pages/3034546421 |
| Travelpayouts → Tripster API | https://support.travelpayouts.com/hc/ru/articles/360028527251 |

> **Важно из официальной документации External Orders:** пользователь партнёра **не может авторизоваться** на сайте Tripster, не получает уведомлений и не переписывается с гидом. Заказ создаётся через API; checkout открывается по ссылке из ответа. Если гид не подтвердил заказ за 24 часа — заказ автоматически отменяется. Цена при создании заказа — **полная цена в рублях**.

> **Доступ к методам (официально):** методы каталога (экскурсии, расписание, цены) **общедоступны и не требуют авторизации**. Авторизация (токен) обязательна только для методов работы с заказами: создание, оплата, получение статуса. В проекте к каталогу всё равно передаётся `Authorization: Bearer` — это допустимо и не мешает публичным методам.

## Переменные окружения

| Переменная | Назначение |
|------------|------------|
| `TRIPSTER_PARTNER` | Идентификатор партнёра (например `travelpayoutsapi` через Travelpayouts) |
| `TRIPSTER_SECRET` | Secret key (отдельно для теста и прода) |
| `TRIPSTER_API_BASE` | База API, по умолчанию `https://experience.tripster.ru/api` |

Проверка: `node scripts/tripster-verify.mjs`

## Базовые URL

- **API:** `{TRIPSTER_API_BASE}/partners/{TRIPSTER_PARTNER}/…`
- **Публичный сайт:** `https://experience.tripster.ru`

## Авторизация

```http
POST https://experience.tripster.ru/api/auth/obtain_token/partner/
Content-Type: application/json

{"partner": "travelpayoutsapi", "secret": "<TRIPSTER_SECRET>"}
```

Ответ:

```json
{"token": "07dc60023f72834dbbb1808ac2d6e03f8d4f0494"}
```

Дальнейшие запросы: `Authorization: Bearer {token}`.

> **Расхождение в официальных документах по схеме авторизации:** страницы «Авторизация партнёра» (affiliate) и «Авторизация» (External Orders), обновлённые в 2025, показывают `Authorization: Bearer {token}`. Более старая страница «Создание заказа» (2021) показывает `Authorization: Token {token}`. Проект использует **`Bearer`** как актуальную схему, но при создании заказа на ответ `401/403` **автоматически повторяет запрос со схемой `Token`** для совместимости (`createTripsterExternalOrder` в `src/lib/tripster/booking-api.ts`).

Реализация: `src/lib/tripster/auth.ts`

## Ключевые endpoints (каталог)

Все пути относительно `/api/partners/{partner}/`.

| Метод | Путь | Auth | Назначение |
|-------|------|------|------------|
| GET | `/countries/` | Bearer | Страны |
| GET | `/cities/?country={id}` | Bearer | Города |
| GET | `/experiences/?city={id}&page=…` | Bearer | Листинг |
| GET | `/experiences/{id}/?detailed=true&price_format=detailed` | Bearer | Карточка |
| GET | `/experiences/{id}/schedule/` | Bearer | Расписание |
| GET | `/experiences/{id}/price/?persons_count=&tickets=&date=&time=` | публичный | Котировка цены |
| GET | `/experiences/{id}/reviews/` | Bearer | Отзывы |
| GET | `/experiences/{id}/plan/` | Bearer | Программа тура |
| GET | `/web/v2/experiences/{id}/` | Bearer | Доп. поля (не partner API) |

Реализация: `src/lib/tripster/client.ts`, `src/lib/tripster/booking-api.ts`

### Уточнение цены перед заказом (официально)

`GET /api/partners/{partner}/experiences/{experience_id}/price/` с query: `persons_count`, `tickets` (`[{"id":int,"count":int}]`), `date`, `time`.

Ответ:

```json
{
  "value": 3500.0,
  "pre_pay": 810.0,
  "payment_to_guide": 2690.0,
  "per_ticket": [{ "id": 3917702062, "title": "Стандартный билет", "count": 2, "price": 3500.0 }],
  "currency": "RUB",
  "currency_rate": 1.0
}
```

## External Orders API (бронирование)

| Метод | Путь | Заголовки |
|-------|------|-----------|
| POST | `/external_orders/` | `Authorization`, `Content-Type: application/json`, **`Idempotency-Key: {uuid}`**, **`X-REQUESTID: {uuid}_{unix_timestamp}`** |

- **`Idempotency-Key`** — обязателен. При отсутствии официально возвращается `400 {"Idempotency-Key": "Отсутствует заголовок уникальности запроса"}`. Обработанный результат хранится в системе **1 час**.
- **`X-REQUESTID`** — по общему workflow External Orders заголовок обязателен в каждом запросе. Формат: `{uuid}_{unix_timestamp}` (целое число секунд). Запросы с request_id **старше 30 минут** возвращаются с кодом `400`, поэтому он генерируется непосредственно перед отправкой (`buildTripsterRequestId`).
- Все обязательные поля тела: `experience`, `date`, `time`, `persons_count`, `tickets`, `name`, `email`, `phone`. Необязательное: `message_to_guide`.

### Request body (пример)

```json
{
  "experience": 276,
  "persons_count": 1,
  "tickets": [{ "id": 3917702062, "count": 2 }, { "id": 193973751, "count": 1 }],
  "date": "2026-09-15",
  "time": "12:00:00",
  "name": "Иван Иванов",
  "email": "ivan@example.com",
  "phone": "+79991234567",
  "message_to_guide": "Нужен детский стульчик"
}
```

### Response (пример, HTTP 201)

```json
{
  "id": 123,
  "status": "confirmation",
  "persons_count": 1,
  "profit": 600,
  "price": {
    "value": 6200.0,
    "pre_pay": 1430.0,
    "payment_to_guide": 4770.0,
    "currency": "RUB",
    "currency_rate": 1.0
  },
  "url": "https://experience.tripster.ru/experience/order/123/",
  "message_to_guide": "Привет, гид!",
  "event": { "date": "2026-09-15", "time": "12:00" },
  "experience": { "id": 276, "title": "…" },
  "traveler": { "name": "…", "email": "…", "phone": "…" }
}
```

Возможные значения `status`: **`confirmation`** (ожидание подтверждения гидом), **`pending_payment`** (ожидание оплаты), **`paid`** (оплачен), **`cancelled`** (отменён).

> В документации и в ответах API поле `url` указывает на **`/experience/order/{id}/`**. Иногда встречается legacy-путь **`/orders/{id}/`** — для анонимного пользователя он **даёт 404**, поэтому в проекте переписывается на `/experience/order/{id}/`.

Реализация: `src/lib/tripster/booking-api.ts`, `src/app/api/tripster/booking-request/route.ts`

### Коды ошибок External Orders (официально)

| HTTP | Причина (официальная формулировка) | Поведение проекта |
|------|------------------------------------|-------------------|
| 400 | Отсутствуют/невалидны обязательные поля; занятое время; превышен лимит участников; отсутствует `Idempotency-Key` | `affiliate_fallback`, reason `api_booking_rejected` |
| 401 | «Учетные данные не были предоставлены» (нет авторизации) | `affiliate_fallback`, reason `external_orders_unauthorized` |
| 403 | «У вас нет прав…» (невалидная авторизация / нет доступа к External Orders) | `affiliate_fallback`, reason `external_orders_forbidden` |
| 405 | Использован `GET` вместо `POST` | (не должно возникать — проект всегда `POST`) |
| 503 | Инфраструктура | `affiliate_fallback`, reason `api_unavailable` |

> Официальная документация использует **400** (Bad Request) для всех ошибок валидации (ранее в этом документе ошибочно упоминался `422`).

## Два пути prefilling checkout (критично)

### Путь A — успех External Orders (полное prefilling)

1. `POST /api/tripster/booking-request` → `createTripsterExternalOrder`
2. Из ответа берётся `order.id` и/или `order.url`
3. **Канонический checkout:** `https://experience.tripster.ru/experience/order/{orderId}/`
4. URL оборачивается в Travelpayouts: `wrapTripsterUrlWithAffiliate` (`src/lib/tripster/checkout-url-server.ts`)
5. Клиент открывает через `openPartnerBookingUrl`

На странице checkout уже заполнены дата, время, участники, контакты — данные переданы при создании заказа.

### Путь B — fallback (query params на booking URL)

Когда External Orders недоступен или отклонил запрос:

1. Сервер строит **`fallbackUrl`** через `resolveTripsterAffiliateCheckoutUrl`
2. Базовый URL: **`/experience/booking/{experienceId}/`** (не `/mfs/experience/booking/`)
3. Query params:

| Param | Формат | Надёжность для анонима |
|-------|--------|------------------------|
| `date` | `YYYY-MM-DD` | ✅ высокая (страница выбирает дату) |
| `time` | **`HH:MM`** (НЕ `HH:MM:SS`) | ✅ высокая — но **только** в формате `HH:MM` |
| `persons_count` | число | ❌ **игнорируется** страницей бронирования (см. ниже) |
| `name`, `full_name` | строка | ⚠️ может игнорироваться MFE |
| `email`, `phone` | строка | ⚠️ может игнорироваться MFE |
| `message_to_guide` | строка | ⚠️ может игнорироваться MFE |

> **⚠️ Критично (проверено вживую 2026-06, experience 92634/50900):**
> - Страница `/experience/booking/{id}/` читает `time` **только как `HH:MM`**. При `HH:MM:SS` слот времени **не выбирается** (параметр молча игнорируется). Это и есть многократно воспроизводимая регрессия «время не подставляется».
> - Число участников страница бронирования **не читает ни из какого URL-параметра** (`persons_count`, `persons`, `participants`, `tourists` — все проверены, степпер остаётся на `1`). Гарантированно число туристов подставляется **только** через External Orders (путь A). Параметр `persons_count` оставляем в URL для совместимости и валидации, но он не влияет на prefilling на странице.
>
> **Правило для агентов:** для анонимного fallback гарантированно подставляются только **date + time (`HH:MM`)**. `persons_count` передаём, но не обещаем prefilling без External Orders.

### Реверс-инжиниринг `travelers-booking-mfe` (white-box, 2026-06-27)

Форма бронирования рендерится микрофронтендом Tripster:

- Бандл: `https://experience.tripster.ru/mfs/travelers-booking-mfe/assets/wc-*.js` (Vue 3 + vue-router).

Что MFE **реально** читает из query-строки URL:

| Параметр в URL | Куда подставляется | Как читается в бандле |
|----------------|--------------------|------------------------|
| `date` | дата заказа | `if (d.query?.date) { … v.date = … }` (функция инициализации `t8`) |
| `time` | слот времени | `if (d.query?.time) { … ae.value = … }` (функция `n8`); парсится только как `HH:MM` |
| `utm_source`, `utm_campaign`, `utm_medium`, `utm_term`, `exp_partner`, `erid` | маркетинговые метки в `sessionStorage` (`partner-marks`, TTL 30 дней) | whitelist `KE` → `ZE(window.location.search, KE)` |

Что MFE из URL **НЕ читает** (подтверждено по исходнику бандла):

- **Число участников.** Степпер «Участники» имеет внутренний `id: "persons_count"` (это его id в форме, а **не** URL-параметр) и инициализируется значением по умолчанию из данных экскурсии (`min`/`max_persons`). Чтения `d.query.persons_count` / `persons` / `participants` / `tourists` / `guests` / `adults` в бандле **нет**. Поэтому ни один URL-параметр количества туристов не сработает.
- **Контакты.** Поля контактов (`["email","phone","name","full_name"]`) заполняются из сохранённых данных профиля/сессии (`e8 → s(ie.value, …)`), **а не из `window.location.search`**. Для анонимного партнёрского пользователя они из URL не подставляются.

> **Итог для вопроса «как у date/time подставить число туристов через URL»:** имени поля для извлечения **не существует** — у `date`/`time` есть явные ридеры `d.query?.date` / `d.query?.time`, а аналогичного ридера для участников/контактов в MFE нет. Единственный способ предзаполнить число туристов и контакты — путь A (External Orders, передаётся в теле заказа). Наш код уже отправляет канонический `persons_count` (совпадает с External Orders и методом цены) — это корректно и менять не нужно.

### Эмпирическая перепроверка (2026-06-27, живой браузер + бандл + API)

Поскольку вопрос «контакты раньше подставлялись» поднимался многократно, проведена сквозная проверка на реальной экскурсии каталога **50248** (Буэнос-Айрес, «Район Сан-Тельмо»), реальный слот `2026-07-01 10:00`:

1. **Бандл MFE** `wc-BzXpPnug.js` (1 046 604 байт) скачан и проверен поиском: единственные чтения query-строки — `d.query?.date` и `d.query?.time`. Чтений `persons_count` / `persons` / `participants` / `tourists` / `guests` / `adults` / `name` / `full_name` / `email` / `phone` / `message_to_guide` из `query` **нет**. Контакты заполняет функция `e8`: `if(!se.value||!ie.value)return; const U=s(ie.value,$); Object.assign(v,U)` — то есть из **сохранённого профиля/сессии залогиненного пользователя Tripster**, а не из URL.
2. **Живой браузер** (анонимная сессия):
   - `…/experience/booking/50248/?date=2026-07-01&time=10:00` → дата = «1 июля 2026, ср» ✅, слот «10:00–12:30» выбран ✅, «Участник» = 1 (по умолчанию), контакты пусты.
   - С добавлением `persons_count=3` → степпер всё равно **1** (параметр проигнорирован).
   - С добавлением `name`/`email`/`phone`/`full_name`/`message_to_guide` → поля «Как вас зовут / Ваша эл. почта / Ваш телефон» **остаются пустыми** (параметры проигнорированы; страницу не ломают).
3. **External Orders** (`node scripts/tripster-verify.mjs`) → **403 FORBIDDEN** для партнёра `travelpayoutsapi` (общий партнёр Travelpayouts). Это и есть единственная причина, по которой полный prefill (участники + контакты) сейчас невозможен.
4. **Официальные affiliate-docs Tripster** («2.1 Формирование ссылок») перечисляют для URL только `exp_partner`, `utm_source`, `utm_campaign`, `utm_medium`, `utm_term`. Параметров для контактов/участников **нет**. Reseller Booking API у Tripster — «coming soon», т.е. доступ к созданию заказов выдаётся отдельно (что согласуется с 403).

> **Вывод:** «рабочий способ» из памяти пользователя = **путь A (External Orders)**, который отдавал `/experience/order/{id}/` с полным prefill даже анонимному посетителю (заказ создаётся нашим сервером по партнёрскому токену). Он перестал работать не из-за регрессии в нашем коде, а потому что External Orders отвечает **403** (у общего партнёрского аккаунта Travelpayouts нет прав на создание заказов). Через URL контакты и число участников подставить нельзя — это ограничение MFE Tripster, подтверждённое исходником бандла, живым браузером и официальной документацией.
>
> **Как восстановить полный prefill:** получить у Tripster доступ к External Orders для отдельного партнёрского аккаунта и прописать его `TRIPSTER_PARTNER`/`TRIPSTER_SECRET`. После этого `external_orders` начнёт возвращать `201`, и достаточно включить `ENABLE_PARTNER_CONTACT_FORM = true` — поток сам пойдёт по пути A.

**Проверенная рабочая ссылка (date + time, анонимно, prefill подтверждён в браузере):**

```
https://experience.tripster.ru/experience/booking/50248/?date=2026-07-01&time=10%3A00&persons_count=3
```

Партнёрская (Travelpayouts) обёртка той же ссылки: `https://tripster.tpx.li/fkVcjNIq`

Построение URL: `buildTripsterPartnerBookingUrl` в `src/lib/tripster/partner-tour-utils.ts`

Пример:

```
https://experience.tripster.ru/experience/booking/50900/?date=2026-09-01&time=10%3A00&persons_count=3&name=…&email=…&phone=…
```

### Travelpayouts-обёртка fallback / order URL

После построения Tripster URL вызывается:

```typescript
createTripsterAffiliateLink({ tripsterUrl, experienceId, citySlug })
// → POST https://api.travelpayouts.com/links/v1/create
```

Типичный результат (short link):

```
https://tp.media/r?marker=434047&u=https%3A%2F%2Fexperience.tripster.ru%2Fexperience%2Fbooking%2F50900%2F%3Fdate%3D…
```

Параметр `u` содержит закодированный целевой Tripster URL **со всеми query params**.  
Извлечение experience id из обёртки: `extractTripsterExperienceId` в `src/lib/tripster/checkout-url.ts`

## Публичные URL — что работает, что ломается

| URL | Статус | Комментарий |
|-----|--------|-------------|
| `/experience/{id}/` | ✅ | Карточка экскурсии |
| `/experience/booking/{id}/?date&time` | ✅ | Fallback checkout: подставляются дата и время (`time` только `HH:MM`); `persons_count` страницей игнорируется |
| `/experience/order/{id}/` | ✅ | Checkout после External Orders |
| `/orders/{id}/` | ❌ 404 | Legacy path из API; **переписывать** в `/experience/order/{id}/` |
| `/mfs/experience/booking/{id}/` | ⚠️ | MFE-вариант; проект использует канонический `/experience/booking/` |

## Реализация в репозитории

| Задача | Файлы |
|--------|-------|
| Checkout URL logic | `src/lib/tripster/checkout-url.ts`, `checkout-url.test.ts` |
| Affiliate wrap (server) | `src/lib/tripster/checkout-url-server.ts` |
| Booking URL builder | `src/lib/tripster/partner-tour-utils.ts` |
| API route | `src/app/api/tripster/booking-request/route.ts` |
| Affiliate redirect | `src/app/api/affiliate/go/[slug]/route.ts` |
| Open in new tab | `src/lib/tripster/open-partner-booking-url.ts` |
| UI (excursion) | `src/components/excursions/ExcursionBookingContactSection.tsx` |
| UI (partner tour) | `src/components/tour-detail/PartnerTourBookingContactSection.tsx` |
| Sync / catalog | `scripts/tripster-sync.mjs`, `src/lib/tripster/repository.ts` |

## Что сломало prefilling (регрессии и исправления)

### 1. Прямое использование `order.url` с `/orders/{id}/` (до e4f7786)

**Симптом:** после успешного API заказ открывался, но страница 404.  
**Причина:** Tripster иногда возвращает `/orders/{id}/`; для анонимного партнёрского пользователя работает только `/experience/order/{id}/`.  
**Исправление:** `normalizeTripsterOrderUrl`, `resolveTripsterCheckoutUrl`, блокировка в `openPartnerBookingUrl`.

Коммит: `e4f7786` — «Fix Tripster checkout URLs: avoid broken /orders/ paths and pass form data».

### 2. Клиент не передавал контакты в fallback URL (до e4f7786)

**Симптом:** при fallback открывалась только дата/время без имени и email.  
**Причина:** `buildTripsterPartnerBookingUrl` не добавлял `name`, `email`, `phone`, `message_to_guide`; клиент брал `data.orderUrl ?? data.fallbackUrl` без нормализации.  
**Исправление:** расширен builder + `resolveTripsterCheckoutUrl` на клиенте с полным контекстом формы.

### 3. Клиент пересобирал fallback локально вместо server `fallbackUrl` (до 18e8728)

**Симптом:** терялась Travelpayouts-обёртка и/или query params; affiliate не учитывался.  
**Причина:** `resolveTripsterBookingRedirectFromApi` не предпочитал `response.fallbackUrl`.  
**Исправление:** при `mode: affiliate_fallback` **всегда** использовать server `fallbackUrl` (уже с affiliate + params).

Коммит: `18e8728` — «use server fallback URL and affiliate-wrapped order links».

### 4. Цепочка `/api/affiliate/go/` как единственный fallback (старый код)

**Симптом:** лишний redirect, риск потери params.  
**Исправление:** сервер возвращает готовый абсолютный `fallbackUrl`; affiliate/go остаётся для простых переходов без формы.

### 5. External Orders 403

**Симптом:** prefilling контактов невозможен — только путь B.  
**Действие:** запросить подключение External Orders у Tripster; до этого UX честно предупреждает (`resolveTripsterFallbackDescription`).

### 6. `time=HH:MM:SS` в fallback-URL → время не подставляется (до текущего фикса)

**Симптом (повторяющаяся регрессия):** при «Подтвердить и забронировать» дата подставлялась, а **время и число туристов — нет**.  
**Истинная причина (проверено вживую в браузере на experience 92634 и 50900):**
- `buildTripsterPartnerBookingUrl` через `normalizeTripsterBookingTime` добавлял к времени секунды (`21:30` → `21:30:00`). Страница бронирования Tripster читает `time` **только как `HH:MM`** и при `HH:MM:SS` молча игнорирует параметр — слот времени не выбирается. Прошлые «фиксы» (`5feb755`, `b13710d`, `4865505`) правили выбор серверного fallback и валидацию параметров, но **формат времени оставался `HH:MM:SS`**, поэтому время по-прежнему не подставлялось.
- Число участников страница бронирования **не читает из URL вообще** (проверены `persons_count`, `persons`, `participants`, `tourists` — степпер всегда `1`). Это не баг нашего кода: на стороне Tripster без External Orders prefill участников через URL невозможен.

**Исправление:** `normalizeTripsterBookingTime` теперь отдаёт `HH:MM` (отбрасывает секунды) для URL-страницы бронирования. External Orders POST по-прежнему использует `HH:MM:SS` (отдельная функция `normalizeTimeForApi`). Регресс-тесты в `checkout-url.test.ts` фиксируют `HH:MM` в финальном URL и явно запрещают `HH:MM:SS`.

## Чеклист для изменений кода

- [ ] Успешный order → `/experience/order/{id}/`, не `/orders/`
- [ ] Fallback → `/experience/booking/{id}/` + `time` в формате **`HH:MM`** (НЕ `HH:MM:SS` — страница бронирования игнорирует секунды); `persons_count` не подставляется страницей
- [ ] При `affiliate_fallback` клиент использует `response.fallbackUrl` as-is
- [ ] Успешный order URL оборачивается в Travelpayouts на сервере
- [ ] External Orders POST содержит заголовки `Idempotency-Key` **и** `X-REQUESTID` (`{uuid}_{unix_timestamp}`)
- [ ] Авторизация: `Bearer`, с автоповтором на `Token` при `401/403`
- [ ] Тесты: `checkout-url.test.ts`, `open-partner-booking-url.test.ts`, `booking-api.test.ts`
- [ ] E2E: `tests/e2e/tripster-partner-invariants.spec.ts`
