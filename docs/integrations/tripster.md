# Tripster — Partner API, External Orders, prefilling checkout

## Официальная документация

| Раздел | URL |
|--------|-----|
| Каталог (Partner API NEW) | https://tripster.atlassian.net/wiki/spaces/affiliates/pages/3688235009 |
| External Orders — обзор | https://tripster.atlassian.net/wiki/spaces/PEO/overview |
| External Orders — API | https://tripster.atlassian.net/wiki/spaces/PEO/pages/3035136001 |
| Авторизация (affiliate) | https://tripster.atlassian.net/wiki/spaces/affiliates/pages/3736502353 |
| Авторизация (External Orders) | https://tripster.atlassian.net/wiki/spaces/PEO/pages/3034841206 |
| Создание заказа | https://tripster.atlassian.net/wiki/spaces/PEO/pages/3034546421 |
| Travelpayouts → Tripster API | https://support.travelpayouts.com/hc/ru/articles/360028527251 |

> **Важно из официальной документации External Orders:** пользователь партнёра **не может авторизоваться** на сайте Tripster. Заказ создаётся через API; checkout открывается по ссылке из ответа.

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
| GET | `/experiences/{id}/price/?persons_count=&date=&time=` | Bearer | Котировка |
| GET | `/experiences/{id}/reviews/` | Bearer | Отзывы |
| GET | `/experiences/{id}/plan/` | Bearer | Программа тура |
| GET | `/web/v2/experiences/{id}/` | Bearer | Доп. поля (не partner API) |

Реализация: `src/lib/tripster/client.ts`, `src/lib/tripster/booking-api.ts`

## External Orders API (бронирование)

| Метод | Путь | Заголовки |
|-------|------|-----------|
| POST | `/external_orders/` | `Authorization`, `Content-Type: application/json`, **`Idempotency-Key: {uuid}`** |

### Request body (пример)

```json
{
  "experience": 276,
  "persons_count": 2,
  "date": "2026-09-15",
  "time": "12:00:00",
  "tickets": [{"id": 39177020, "count": 2}],
  "name": "Иван Иванов",
  "email": "ivan@example.com",
  "phone": "+79991234567",
  "message_to_guide": "Нужен детский стульчик"
}
```

### Response (пример)

```json
{
  "id": 123,
  "status": "pending",
  "url": "https://experience.tripster.ru/experience/order/123/",
  "price": { "value": 5000, "currency": "RUB" },
  "event": { "date": "2026-09-15", "time": "12:00:00" },
  "experience": { "id": 276, "title": "…" },
  "traveler": { "name": "…", "email": "…", "phone": "…" }
}
```

> В документации и в ответах API поле `url` должно указывать на **`/experience/order/{id}/`**. Иногда встречается legacy-путь **`/orders/{id}/`** — для анонимного пользователя он **даёт 404**.

Реализация: `src/lib/tripster/booking-api.ts`, `src/app/api/tripster/booking-request/route.ts`

### Типичные ошибки External Orders

| HTTP | Причина | Поведение проекта |
|------|---------|-------------------|
| 401 | Неверный token/secret | `affiliate_fallback`, reason `external_orders_unauthorized` |
| 403 | External Orders не подключён к аккаунту | `affiliate_fallback`, reason `external_orders_forbidden` |
| 422 | Невалидные поля, занятое время, лимит участников | `affiliate_fallback`, reason `api_booking_rejected` |
| 503 | Инфраструктура | `affiliate_fallback`, reason `api_unavailable` |

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
- [ ] Тесты: `checkout-url.test.ts`, `open-partner-booking-url.test.ts`
- [ ] E2E: `tests/e2e/tripster-partner-invariants.spec.ts`
