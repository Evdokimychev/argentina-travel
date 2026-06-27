# Sputnik8 — экскursions API (affiliate-first)

## Официальная документация

| Раздел | URL |
|--------|-----|
| Sputnik8 API | https://www.sputnik8.com/doc/api |
| Доступ через Travelpayouts | Partner dashboard → Access to Sputnik8 API |

## Переменные окружения

| Переменная | Назначение |
|------------|------------|
| `SPUTNIK8_API_KEY` | API key |
| `SPUTNIK8_USERNAME` | Username |
| `SPUTNIK8_API_BASE` | `https://api.sputnik8.com/v1` |
| `SPUTNIK8_SYNC_COUNTRY` | Фильтр синка (argentina) |

Auth в query string: `?api_key=…&username=…` на каждый запрос.

## Ключевые endpoints

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/products` | Каталог |
| GET | `/products/{id}` | Карточка |
| GET | `/events` | Слоты / расписание |
| POST | `/orders` | Создание заказа (если включено) |

Реализация: `src/lib/sputnik8/client.ts`, `src/lib/sputnik8/booking-api.ts`

## UX в проекте

Текущий публичный flow — **affiliate redirect**, не native checkout:

- Карточка: `bookingHref: /api/affiliate/go/{slug}`
- Redirect: `createSputnik8AffiliateLink` → Travelpayouts tp.media
- Route: `src/app/api/affiliate/go/[slug]/route.ts` (ветка `sputnik8`)

Native booking API (`src/lib/sputnik8/booking-api.ts`) подготовлен, но основной UX — переход на sputnik8.com с атрибуцией.

## Prefilling

Query params на deep link **не документированы** для Sputnik8 в нашем коде — prefilling через partner site после redirect.  
При добавлении native booking — сверяться с официальным API orders/events.

## Реализация

| Задача | Файлы |
|--------|-------|
| Sync | `scripts/sputnik8-sync.mjs` |
| Mapper | `src/lib/sputnik8/mapper.ts` |
| Repository | `src/lib/sputnik8/repository.ts` |
| Affiliate | `createSputnik8AffiliateLink` в `src/lib/travelpayouts/client.ts` |

## Связь с Travelpayouts

Обязательная обёртка ссылок — см. [travelpayouts.md](./travelpayouts.md).
