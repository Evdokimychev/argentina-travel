# Marketplace quality (Sprint 2)

Партнёрский API не является готовым публичным контентом. Публичный каталог проходит
**Public Offer Quality Gate** перед показом коммерческих карточек.

## Pipeline

```
SOURCE API → sync/cache → normalize → validate → editorial → classify → publish decision → public catalog
```

Канонический код:

- `src/lib/partner-tours/offer-quality.ts` — publish states + reason codes
- `src/lib/partner-tours/freshness.ts` — fresh / warning / stale / critical
- `src/lib/partner-tours/content-quality.ts` — детерминированная санитизация текста
- `src/lib/partner-tours/calendar-date.ts` — даты в TZ Аргентины
- `src/lib/partner-tours/duplicate-detection.ts` — сигналы вероятных дублей (без auto-merge)
- `src/data/marketplace-tours-server.ts` — `filterBookableMarketplaceListings` на merge

## Publish states

| State | Смысл |
|-------|--------|
| `publishable` | Можно показывать как доступное коммерческое предложение |
| `degraded` | В каталоге допустимо, но есть мягкие ограничения (нет расписания и т.п.) |
| `temporarily_unavailable` | Не bookable (прошлые даты / sold out) |
| `quarantined` | Контент/медиа сомнительны |
| `rejected` | Hard blocker (цена, booking URL, identity, критический stale) |

## Команды

```bash
npm run marketplace:quality
npm run marketplace:quality:prod
npm run test:partner-regression
```

Операционный UI: Admin → Настройки → Операции → «Здоровье партнёрских лент»
(данные из `/api/health/partners`).

## Sync safety

Пустой ответ API не удаляет production-каталог:

- YouTravel / Tripster — fail на 0 discovered
- YouTravel / Sputnik8 — abort при подозрительном обвале объёма относительно существующего зеркала
