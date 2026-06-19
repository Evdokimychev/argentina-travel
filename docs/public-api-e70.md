# E70 — Публичное API v1 и партнёрские виджеты

Публичное read-only API для партнёров и агрегаторов: каталог туров, карточка тура, каталог экскурсий. Доступ по API-ключу с областями (`scopes`) и лимитом запросов.

## Базовый URL

```
https://www.goargentina.ru/api/v1
```

Локально: `http://localhost:3000/api/v1`.

## Аутентификация

Передайте ключ в заголовке:

```http
Authorization: Bearer pva_live_xxxxxxxx
```

или

```http
X-API-Key: pva_live_xxxxxxxx
```

Ключи создаются в админке: **Система → API-ключи** (`/admin/system/api-keys`). Полный ключ показывается **один раз** при создании.

### Области доступа (scopes)

| Scope | Ресурс |
|-------|--------|
| `tours:read` | `GET /tours`, `GET /tours/{slug}` |
| `excursions:read` | `GET /excursions` |
| `*` | все read-эндпоинты |

Если у ключа задан `organizer_id`, список туров дополнительно ограничивается турами этого организатора.

## CORS

Для вызовов из браузера партнёра задайте переменную окружения:

```env
PUBLIC_API_CORS_ORIGINS=https://partner.example.com,https://widgets.example.org
```

Поддерживается preflight (`OPTIONS`). Без совпадения `Origin` CORS-заголовки не выставляются.

## Лимиты

In-memory sliding window на ключ (`rate_limit_per_minute`, по умолчанию 60/мин). При превышении:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 12
```

```json
{ "error": "Превышен лимит запросов" }
```

## Эндпоинты

### GET /api/v1/tours

Список опубликованных туров с пагинацией.

**Query**

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `page` | integer | 1 | Страница |
| `pageSize` | integer | 24 | Размер страницы (1–100) |
| `organizer` | string | — | Фильтр по slug организатора |

**Пример запроса**

```http
GET /api/v1/tours?page=1&pageSize=12&organizer=org-demo HTTP/1.1
Host: www.goargentina.ru
Authorization: Bearer pva_live_xxxxxxxx
Accept: application/json
```

**Пример ответа `200`**

```json
{
  "data": [
    {
      "slug": "patagonia-trek",
      "title": "Треккинг в Патагонии",
      "shortDescription": "7 дней у ледников и озёр",
      "image": "https://…",
      "destination": "Эль-Калафате",
      "region": "Патагония",
      "country": "Аргентина",
      "activityType": "Треккинг",
      "durationDays": 7,
      "durationNights": 6,
      "priceUsd": 1890,
      "rating": 4.9,
      "reviewCount": 12,
      "organizer": {
        "name": "…",
        "slug": "org-demo",
        "avatar": "https://…"
      },
      "badges": ["hot"],
      "url": "https://www.goargentina.ru/tours/patagonia-trek"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 12,
    "total": 48,
    "totalPages": 4
  }
}
```

### GET /api/v1/tours/{slug}

Детальная карточка тура.

**Пример запроса**

```http
GET /api/v1/tours/patagonia-trek HTTP/1.1
Authorization: Bearer pva_live_xxxxxxxx
```

**Ответ `200`**

```json
{
  "data": {
    "slug": "patagonia-trek",
    "title": "…",
    "gallery": ["https://…"],
    "descriptionBlocks": [],
    "itinerary": [],
    "included": [],
    "excluded": [],
    "faq": [],
    "dates": [],
    "organizer": {},
    "reviews": [],
    "url": "https://www.goargentina.ru/tours/patagonia-trek"
  }
}
```

**Ответ `404`**

```json
{ "error": "Тур не найден" }
```

### GET /api/v1/excursions

Пагинированный каталог экскурсий (Tripster + Sputnik8).

**Query**

| Параметр | Тип | Описание |
|----------|-----|----------|
| `page`, `pageSize` | integer | Пагинация |
| `city` | string | Slug города |
| `q` | string | Поисковый запрос |
| `sort` | enum | `popular` · `rating` · `price_asc` · `price_desc` |

**Пример ответа `200`**

```json
{
  "data": [
    {
      "slug": "tripster-buenos-aires-walk",
      "title": "…",
      "citySlug": "buenos-aires",
      "cityName": "Буэнос-Айрес",
      "partner": "tripster",
      "reviewCount": 120,
      "url": "https://www.goargentina.ru/excursions/tripster-buenos-aires-walk"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 24,
    "total": 340,
    "totalPages": 15
  }
}
```

## Коды ошибок

| HTTP | Тело | Причина |
|------|------|---------|
| 401 | `{ "error": "…" }` | Нет или неверный ключ |
| 403 | `{ "error": "Недостаточно прав…" }` | Нет нужного scope |
| 429 | `{ "error": "Превышен лимит…" }` | Rate limit |
| 503 | `{ "error": "… unavailable" }` | Supabase/каталог недоступен |

## Виджет туров (embed v1)

Скрипт-загрузчик монтирует iframe на `/embed/tours`:

```html
<script src="https://www.goargentina.ru/embed/v1/tours.js" async></script>

<div
  data-pva-tours
  data-organizer="org-demo"
  data-theme="dark"
  data-variant="grid"
  data-limit="6"
  data-title="Туры по Аргентине"
  data-height="480px"
></div>
```

### Data-атрибуты

| Атрибут | Значения | Описание |
|---------|----------|----------|
| `data-pva-tours` | — | Маркер контейнера (обязателен) |
| `data-organizer` | slug | Туры одного организатора |
| `data-theme` | `light` · `dark` | Тема iframe |
| `data-variant` | `grid`, `featured`, … | Макет виджета |
| `data-limit` | number | Число карточек |
| `data-title`, `data-subtitle` | string | Заголовки |
| `data-destination`, `data-region`, `data-query`, `data-preset`, `data-slugs` | string | Альтернативные источники |
| `data-height`, `data-radius` | CSS | Размер и скругление iframe |

Программный API: `window.PvaToursEmbed.refresh()` после динамической вставки DOM.

## Миграция БД

```bash
npm run supabase:migrate
```

Таблица `public.api_keys`: хэш ключа (`key_hash`), префикс для UI, `partner_name`, `organizer_id`, `scopes`, `rate_limit_per_minute`, `revoked_at`, `last_used_at`.

## Связь с E34

Legacy-эндпоинты без версии остаются для внутреннего сайта:

- `GET /api/tours`
- `GET /api/tours/[slug]`

Партнёрам рекомендуется **v1** с ключом, CORS и документированной схемой.
