# Интерактивная карта Аргентины — архитектура

## Решение по стеку

| Компонент | Выбор | Примечание |
|-----------|--------|------------|
| Главная карта `/mapa-argentina` | **MapLibre GL JS** + **OpenStreetMap** | Полноэкранный hub, кластеризация, линии маршрутов |
| Мини-карты в статьях / блоках | **Leaflet** + OSM | Уже в проекте, лёгкий bundle |
| Каталоги `/tours?view=map` | Leaflet (существующее) | Постепенная унификация через deep-link |
| Источник данных | **Supabase CMS + Places catalog** | Не Payload CMS runtime; паттерн «Places collection» |

Google Maps **не используется**.

---

## Маршруты

| URL | Назначение |
|-----|------------|
| `/mapa-argentina` | Полноэкранная карта (основная) |
| `/map` | Legacy hub (Leaflet + список) |
| `/api/map/objects` | Unified JSON: объекты + маршруты |
| `/api/map/layers` | Legacy слои (туры/места/регионы) |
| `/destinations/[slug]` | SEO-страницы направлений (существующие) |
| `/places/[slug]` | SEO-страницы мест с координатами |

---

## Типы объектов (`MapMarkerKind`)

- `city` — категории place: `city`, `town`
- `national_park` — `national_park`
- `attraction` — остальные place
- `tour` — каталог туров (`TourListing.latitude/longitude`)
- `airport` — seed `ARGENTINA_AIRPORTS`
- `transport` — слой «Как добраться» (`ARGENTINA_TRANSPORT_HUBS`)
- `route` — полилинии маршрутов туров
- `region` — GeoJSON провинций

---

## CMS / Places (аналог Payload Collection)

**Источник координат:** Prisma `Place` + TS seed `places-seed.ts`  
**Редакция текстов:** CMS `doc_type=place` (Supabase `content_documents`)  
**Новый объект в Places catalog → автоматически на карте** через `fetchPlacesServer()` → `fetchMapObjects()`.

Планируемые поля CMS (Phase 2):

```typescript
// CmsPlaceBody extension
latitude?: number;
longitude?: number;
mapCategory?: MapMarkerKind;
relatedArticleSlugs?: string[];
relatedTourSlugs?: string[];
```

---

## Связь со статьями

- Блоки `map`, `route-map` в page builder
- `extractArticleMapPoints(post)` → `ArticlePlacesMiniMap` в сайдбаре статьи
- `BlogMapBlock` — OSM/Leaflet вместо Google Maps

---

## Связь с экскурсиями / турами

- Маркеры туров из marketplace catalog
- Маршруты: `getTourRoutePoints(slug)` + Phase 2: `tour.program.routePoints`
- Карточка объекта: `relatedTours` через `TOUR_PLACE_MAP`
- Страница тура: `RouteMap` (Leaflet) — без изменений

---

## Слой «Как добраться» (Phase 2)

`ARGENTINA_TRANSPORT_HUBS` — аэропорты, автовокзалы, привязка к `citySlug`  
Интеграция с `argentina-domestic-routes.ts` и `/flights` — отдельный этап.

---

## Файлы

| Область | Путь |
|---------|------|
| Типы | `src/lib/map-types.ts` |
| Агрегация | `src/lib/map-objects-server.ts` |
| API | `src/app/api/map/objects/route.ts` |
| MapLibre canvas | `src/components/map/ArgentinaMapLibreCanvas.tsx` |
| Fullscreen hub | `src/components/map/ArgentinaMapFullscreenHub.tsx` |
| Карточка | `src/components/map/MapObjectCard.tsx` |
| Аэропорты | `src/data/argentina-airports.ts` |
| Транспорт | `src/data/argentina-transport-hubs.ts` |
| Статьи | `src/lib/article-map-points.ts`, `ArticlePlacesMiniMap.tsx` |

---

## SEO

- `/mapa-argentina` — индексируемая страница, hreflang, JSON-LD
- `/destinations/*` — существующие landing'и направлений
- `/places/*` — места с картой на детальной странице

---

## Следующие шаги

1. CMS geo-поля для place + admin editor
2. Organizer routePoints в map API
3. Реальные границы провинций (GeoJSON)
4. Domestic flight routes overlay
5. Единый deep-link из `/tours?view=map` → `/mapa-argentina?kind=tour`
