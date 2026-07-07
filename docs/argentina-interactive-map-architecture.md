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

## Геоданные (реальные границы, выравнивание с картой)

**Принцип:** никаких схематичных bbox/кругов. Границы полигонов берутся **только из OpenStreetMap** — той же базы, что и CARTO/OSM тайлы (`map-basemap-themes.ts`). Natural Earth и другие сторонние наборы не используются: они дают заметное смещение относительно подложки.

| Путь | Назначение |
|------|------------|
| `public/geo/map/*.geojson` | GeoJSON слоёв (OpenStreetMap) |
| `public/geo/map/manifest.json` | Манифест: версия, `basemapAlignment`, источники |
| `scripts/fetch-map-geodata.mjs` | Загрузка через Overpass + osmtogeojson (`npm run map:fetch-geodata`) |
| `src/data/map-thematic/layer-registry.ts` | Реестр: файл, источник, label |
| `src/lib/map-thematic-loader.ts` | Lazy-load + проверка наличия данных |
| `src/lib/map-thematic-maplibre.ts` | Отрисовка, hover, popup |

**Подключённые источники (OSM):**
- `admin_level=4` — провинции; **заливка страны** (`argentina_border`) — та же геометрия, без битого admin_level=2
- подмножества: Патагония, винные регионы
- barrios CABA — районы Буэнос-Айреса
- `protected_area` — национальные парки
- Península Valdés — наблюдение за китами

**Ожидают подключения:** климат, биомы, пляжи, ледники, UNESCO-полигоны, маршруты (Ruta 40 — при успешной Overpass-загрузке), горнолыжные точки.

**Стиль:** полупрозрачная заливка (opacity ~0.08–0.14). Контуры полигонов **не рисуются постоянно** — в покое границу показывает OSM-подложка; при hover — тонкая обводка. GeoJSON-источники с `tolerance: 0` (без упрощения MapLibre на zoom).

Полигоны интерактивны: hover подсвечивает границу, tooltip с названием и источником.

---

Параметр URL: `tl=patagonia,climate_zones,...`  
Состояние: `MapThematicState` в `src/lib/map-thematic-layers.ts`  
GeoJSON: `public/geo/map/*.geojson` (генерация: `npm run map:fetch-geodata`)  
Отрисовка MapLibre: `src/lib/map-thematic-maplibre.ts`  
UI: `MapThematicLayersControl` (левый край карты)

| ID | Содержание |
|----|------------|
| `argentina_border` | Контур страны |
| `patagonia` | Макрорегион Патагония |
| `climate_zones` | Климатические зоны (data-driven цвета) |
| `provinces` | Провинции (общий source `regions`) |
| `popular_regions` | Популярные туристические зоны |
| `ba_neighborhoods` | 48 barrios CABA (OSM) + подписи на русском |
| `ba_recommended` | 13 районов, рекомендуемых для проживания (производный слой) |
| `national_parks_area` | Полигоны нацпарков |
| `wine_regions`, `beaches`, `whale_watching`, `glacier_zones`, `biosphere` | Природа / регионы |
| `ruta_40`, `ruta_3`, `panamericana`, `scenic_routes`, `patagonia_routes` | Автомобильные маршруты |
| `ski_resorts`, `unesco` | Точки |
| `climate_zones`, `biosphere`, `beaches` | Статические/упрощённые зоны |
| `popular_regions`, `glacier_zones` | Производные от провинций / нацпарков |

Рельеф / 3D / спутник — отдельно через `layers=` (`map-overlay-layers.ts`).

### Встраиваемая карта районов CABA

Для статей о Буэнос-Айресе — компонент `BuenosAiresBarriosMap`:

```tsx
import BuenosAiresBarriosMap from "@/components/map/BuenosAiresBarriosMap";

<BuenosAiresBarriosMap mode="both" height={480} showLegend />
```

- `mode`: `all` | `recommended` | `both`
- Реестр 48 barrios: `src/data/map-barrios/caba-barrios-registry.json`
- GeoJSON: `npm run map:fetch-geodata` (Overpass; при таймауте — по одному barrio)

---

## Города из базы знаний

Если город есть в `ARGENTINA_CITIES`, но отсутствует в каталоге `places`, на карту добавляется supplementary-метка через `buildSupplementaryCityObjects()` (ссылка на `/baza-znaniy/{slug}`).

---

## Файлы

| Область | Путь |
|---------|------|
| Типы | `src/lib/map-types.ts` |
| Агрегация | `src/lib/map-objects-server.ts` |
| Поиск на карте | `src/lib/map-search.ts` |
| Доп. города | `src/lib/map-supplementary-cities.ts` |
| URL state | `src/lib/map-argentina-url-state.ts` |
| Тематические слои | `src/lib/map-thematic-layers.ts`, `map-thematic-maplibre.ts` |
| API | `src/app/api/map/objects/route.ts` |
| MapLibre canvas | `src/components/map/ArgentinaMapLibreCanvasInner.tsx` |
| **Районы CABA (embed)** | `src/components/map/BuenosAiresBarriosMap.tsx`, `src/data/map-barrios/` |
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
