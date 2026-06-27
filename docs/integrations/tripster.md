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
| `date` | `YYYY-MM-DD` | ✅ высокая |
| `time` | `HH:MM:SS` (не `HH:MM`) | ✅ высокая |
| `persons_count` | число | ✅ обычно |
| `name`, `full_name` | строка | ⚠️ может игнорироваться MFE |
| `email`, `phone` | строка | ⚠️ может игнорироваться MFE |
| `message_to_guide` | строка | ⚠️ может игнорироваться MFE |

> **Правило для агентов:** для анонимного fallback считайте надёжными только **date + time + persons_count**. Контакты передаём в URL на случай поддержки со стороны Tripster, но не гарантируем prefilling без External Orders.

Построение URL: `buildTripsterPartnerBookingUrl` в `src/lib/tripster/partner-tour-utils.ts`

Пример:

```
https://experience.tripster.ru/experience/booking/50900/?date=2026-09-01&time=10%3A00%3A00&persons_count=3&name=…&email=…&phone=…
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
| `/experience/booking/{id}/?date&time&persons_count` | ✅ | Fallback checkout с prefilling даты/времени |
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

## Чеклист для изменений кода

- [ ] Успешный order → `/experience/order/{id}/`, не `/orders/`
- [ ] Fallback → `/experience/booking/{id}/` + `time` в формате `HH:MM:SS`
- [ ] При `affiliate_fallback` клиент использует `response.fallbackUrl` as-is
- [ ] Успешный order URL оборачивается в Travelpayouts на сервере
- [ ] External Orders POST содержит заголовки `Idempotency-Key` **и** `X-REQUESTID` (`{uuid}_{unix_timestamp}`)
- [ ] Авторизация: `Bearer`, с автоповтором на `Token` при `401/403`
- [ ] Тесты: `checkout-url.test.ts`, `open-partner-booking-url.test.ts`, `booking-api.test.ts`
- [ ] E2E: `tests/e2e/tripster-partner-invariants.spec.ts`
