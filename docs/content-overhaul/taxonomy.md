# Таксономия публичного контента

Baseline: 2026-07-15. Этот документ описывает фактические словари и параллельные контентные слои репозитория; он не заменяет исходную схему базы знаний.

## Каноническая база знаний

Источник истины для enum и управляемых словарей: `content/knowledge-base/SCHEMA.md` и `content/knowledge-base/TAXONOMY.md`.

| type | записей | папка / правило |
|---|---:|---|
| `attraction` | 383 | см. `content/knowledge-base/TAXONOMY.md` |
| `guide` | 98 | см. `content/knowledge-base/TAXONOMY.md` |
| `faq` | 60 | см. `content/knowledge-base/TAXONOMY.md` |
| `city` | 49 | см. `content/knowledge-base/TAXONOMY.md` |
| `national_park` | 44 | см. `content/knowledge-base/TAXONOMY.md` |
| `author_tip` | 29 | см. `content/knowledge-base/TAXONOMY.md` |
| `transport` | 11 | см. `content/knowledge-base/TAXONOMY.md` |
| `region` | 8 | см. `content/knowledge-base/TAXONOMY.md` |
| `route` | 7 | см. `content/knowledge-base/TAXONOMY.md` |

Статусы на дату baseline: `published` — 459; `stub` — 227; `backlog` — 3.

Канонические `site_sections` (7):

- `puteshestviya-po-argentine`;
- `goroda-i-regiony`;
- `zhizn-v-strane`;
- `pereezd-v-argentinu`;
- `dokumenty-i-legalizatsiya`;
- `finansy-i-ekonomika`;
- `lichnyy-opyt`.

Макрорегионы: `caba`, `buenos-aires-province`, `patagonia`, `cuyo`, `noa`, `litoral`, `pampa`, `tierra-del-fuego`.

## Параллельные публичные модели

| слой | записей | публичный маршрут | источник |
|---|---:|---|---|
| `attraction` | 383 | `/baza-znaniy` | `content/knowledge-base/dostoprimechatelnosti/alero-charcamata.md` |
| `blog` | 290 | `/blog` | `src/data/blog.ts` |
| `guide` | 98 | `/baza-znaniy` | `content/knowledge-base/pereezd/apostil-i-perevod-dokumentov.md` |
| `place` | 98 | `/places` | `src/data/places-seed.ts` |
| `faq` | 60 | `/baza-znaniy` | `content/knowledge-base/faq/aktualen-li-blue-dollar.md` |
| `city` | 49 | `/baza-znaniy` | `content/knowledge-base/goroda/bahia-blanca.md` |
| `national_park` | 44 | `/baza-znaniy` | `content/knowledge-base/natsionalnye-parki/aconcagua-provincial-park.md` |
| `author_tip` | 29 | `/baza-znaniy` | `content/knowledge-base/lichnyy-opyt/aep-eze-stykovka.md` |
| `collection` | 14 | `/collections` | `src/data/places-seed.ts` |
| `guide_topic` | 14 | `/guide` | `src/data/guide-topics.ts` |
| `transport` | 11 | `/baza-znaniy` | `content/knowledge-base/transport/aeroporty.md` |
| `region` | 8 | `/baza-znaniy` | `content/knowledge-base/regiony/buenos-aires-province.md` |
| `destination` | 8 | `/destinations` | `src/data/destination-pages.ts` |
| `route` | 7 | `/baza-znaniy` | `content/knowledge-base/marshruty/argentina-10-dney.md` |
| `legal` | 6 | `/legal/affiliate` | `src/data/legal-content.ts` |
| `content_page` | 5 | `/guide` | `src/data/guide-content.ts` |
| `immigration` | 4 | `/immigration` | `src/data/immigration-content.ts` |
| `itinerary` | 3 | `/itineraries` | `src/data/places-seed.ts` |

Эти модели нельзя считать одним enum: одинаковые города, места и темы встречаются в нескольких слоях. Совпадения зафиксированы в `duplicate-content-report.csv`; объединение требует выбора канонического источника и redirect-плана.

## Правила нормализации

1. Публичная русская форма географического названия берётся из `geography-glossary.csv.preferred_ru`.
2. Испанские и латинские формы хранятся как aliases для поиска, а не как отдельные сущности.
3. `Collection` не является регионом, `Destination` не является конкретным `Place`.
4. Практическое evergreen-знание относится к базе знаний / Guide; блог сохраняет авторскую или журнальную роль.
5. Поля `status`, `site_ready`, `last_verified`, `sources`, `related` не заменяются оценкой word count.
6. Новые значения enum сначала добавляются в `content/knowledge-base/TAXONOMY.md`, затем в контент и индексы.

## Evidence

- `content/knowledge-base/_index/content.json` — 689 фактических записей.
- `src/lib/site-search-index-server.ts` — фактические слои единого поиска.
- `src/lib/sitemap-urls.ts` — фактическая сборка sitemap.
- `content-route-matrix.csv` — 58 публичных page routes, найденных в `src/app`.
