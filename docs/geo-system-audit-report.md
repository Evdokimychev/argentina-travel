# Отчёт: единая геосистема «Пора в Аргентину»

Дата: 27 июня 2025  
Ветка: `main`

## 1. Проблемы, обнаруженные до внедрения

| Область | Проблема |
|---------|----------|
| Аэропорты | Дублирование справочников в `home-flight-hubs.ts`, `argentina-domestic-routes.ts`, `argentina-airports.ts` без единого источника названий |
| Поиск рейсов | `autoFocus` в `flight-hub-picker.tsx` вызывал нежелательное открытие клавиатуры на мобильных |
| Поиск рейсов | Однострочные подписи «Город (CODE)» без страны и полного названия аэропорта |
| Туры | `resolveTourCityDisplay` брал `destination` без учёта региона — Patagonia-тур мог показывать «Буэнос-Айрес» |
| Туры | Нет валидации географических несоответствий (BA≠Brazil, Iguazu≠Patagonia и т.д.) |
| Карта | `MapObjectCard` — крупное изображение, лишние отступы; кнопка закрытия без `stopPropagation` |
| Карта | `MapObjectPopup` — `onOpenChange` не всегда вызывал `onClose` при свайпе |

## 2. Исправления

### Единый слой `src/lib/geo/`

- **`types.ts`** — `GeoLocation`, `GeoAirport`, `GeoCountryCode`, `TourLocationInput`
- **`airports.ts`** — загрузка из `src/data/geo/airports.json` (59 аэропортов: AR + BR + международные хабы)
- **`locations.ts`** — мост к `ARGENTINA_CITIES` + макрорегионы
- **`format.ts`** — `formatAirportPickerLine`, `formatTourLocationCompact`, `resolveTourPrimaryLocation`
- **`validation.ts`** — `validateTourLocation()` с 5 правилами
- **`popular-destinations.ts`** — `POPULAR_ARGENTINA`, `POPULAR_INTERNATIONAL`
- **`index.ts`** — реэкспорт API

### UX аэропортов

- Двухшаговый пикер: сначала популярные кнопки, «Искать…» включает поле
- Убран `autoFocus`
- Формат строк:
  ```
  Буэнос-Айрес, Аргентина 🇦🇷
  Международный аэропорт Эсейса (EZE)
  ```
- `getFlightHubLabel` и `formatPlaceLabel` используют geo-слой; Aviasales autocomplete — fallback при поиске

### Отображение локаций туров

- `resolveTourPrimaryLocation` — приоритет макрорегиона для multi-city Patagonia
- `formatTourLocationCompactPlain` в `MarketplaceTourCard`, `TourDetailHeader`, `TourMapListItem`
- `resolveTourCityDisplay` делегирует geo-логику (обратная совместимость для карты и embed)

### Карта

- Компактная `MapObjectCard`: aspect 2/1, `line-clamp-2`, CTAs в одну строку
- `MapObjectPopup`: явный `onOpenChange → onClose`, bottom sheet со swipe

## 3. Архитектура

```
src/data/geo/airports.json     ← seed (IATA, названия RU/EN/ES, координаты, popularity)
         ↓
src/lib/geo/airports.ts        ← lookup, search, flags
src/data/argentina-cities.ts   ← города AR (существующий)
         ↓
src/lib/geo/locations.ts       ← GeoLocation + resolveLocation
         ↓
src/lib/geo/format.ts          ← display + resolveTourPrimaryLocation
src/lib/geo/validation.ts      ← QA rules
         ↓
src/lib/argentina-cities.ts    ← re-export + resolveTourCityDisplay (legacy API)
```

Принцип: **geo/airports.json — primary для display**, Travelpayouts autocomplete — fallback для поиска.

## 4. Публичные API

| Функция | Назначение |
|---------|------------|
| `getAirportByIata(iata)` | Аэропорт из seed |
| `formatAirportPickerFromIata(iata)` | Две строки для пикера |
| `resolveLocation(input)` | Город/макрорегион по строке |
| `resolveTourPrimaryLocation(input)` | Основная локация тура |
| `formatTourLocationCompact(input)` | «📍 Патагония · 3 локации» |
| `validateTourLocation(input)` | Массив предупреждений |
| `getPopularDestinations(kind)` | Популярные для origin/destination |

## 5. Правила валидации

| Код | Правило |
|-----|---------|
| `ba-not-brazil` | Буэнос-Айрес ≠ Бразилия |
| `bariloche-not-chile` | Барилоче ≠ Чили |
| `iguazu-not-patagonia` | Игуасу ≠ макрорегион Патагония |
| `brazil-tour-argentina-display` | Brazil tour ≠ Argentina display |
| `patagonia-region-ba-destination` | region=Patagonia + destination=BA |

## 6. Тесты и аудит

- **`src/lib/geo/validation.test.ts`** — unit-тесты правил и `resolveTourPrimaryLocation`
- **`npm run geo:audit-tours`** — скан seed/static tours, вывод mismatches
- **`npm test`** — полный прогон vitest

### Запуск

```bash
npm test
npm run geo:audit-tours
```

## Синхронизация проекта

| Поле / API | Где отображается | Где редактируется |
|------------|------------------|-------------------|
| `airports.json` | Пикер рейсов, autocomplete labels | `src/data/geo/airports.json` |
| `resolveTourPrimaryLocation` | Карточки каталога, шапка тура | geography в редакторе тура |
| `validateTourLocation` | CI-аудит (`geo:audit-tours`) | — |
| `formatTourLocationCompact` | MarketplaceTourCard, TourMapListItem | — |

Будущие интеграции: Supabase geography columns, organizer CRM validation hints, map popups через geo layer.
