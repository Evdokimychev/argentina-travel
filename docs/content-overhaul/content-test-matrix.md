# Матрица тестов контентной платформы

Дата: 2026-07-15. Приоритеты: P0 — блокирует публикацию/релиз, P1 — обязательный контроль качества, P2 — улучшение.

| ID | Приоритет | Уровень | Область | Проверка | Текущее покрытие | Целевое свидетельство |
|---|---|---|---|---|---|---|
| SEARCH-U-001 | P0 | unit | Static search | `place` присутствует в порядке групп; запрос `Игуасу` возвращает `place` | добавлен во время аудита, проходит локальный запрос | сохранить fixture как regression gate |
| SEARCH-I-002 | P0 | integration | Search API | `kind=place` при принудительном static source возвращает место | отсутствует | API test с отключёнными Meili/DB |
| SEARCH-C-003 | P0 | contract | Index | id и canonical href уникальны; type известен; URL опубликован | ручная проверка; сейчас 514/0 duplicate ids | машинный отчёт по каждому build |
| SEARCH-C-004 | P0 | contract | Publication | draft/blocked/404 документы не входят в индекс | частично через indexable helpers | список исключённых id + причины |
| SEARCH-U-005 | P1 | unit | Normalization | `Игуасу/Iguazu/Iguazú`, `Ушуайя/Ушуая/Ushuaia`, `Жужуй/Jujuy`, дефисы и `ё` эквивалентны | добавляется нормализация, нет полного fixture-набора | table-driven tests для всех провайдеров |
| SEARCH-I-006 | P1 | integration | Provider parity | top clusters сопоставимы в static/Postgres/Meili | отсутствует | gold query set + допустимое отклонение rank |
| SEARCH-I-007 | P1 | integration | Full text | заголовок H2 и текст статьи находятся без попадания body в client payload | частично реализован `searchText` | API assertions + payload size |
| SEARCH-I-008 | P1 | integration | Freshness | непустой, но устаревший индекс даёт readiness fail/reindex | нет; проверяется преимущественно empty state | version/count mismatch fixture |
| SEARCH-E-009 | P1 | e2e | Search dialog | открыть header/mobile/⌘K, ввести запрос, выбрать стрелками, Enter, Escape, возврат фокуса | код поддерживает большую часть, нет E2E | desktop + 390 px browser trace |
| SEARCH-E-010 | P1 | e2e | Zero state | предлагает снять filter, исправить алиас и открыть хабы; шлёт `search_no_results` | отсутствует | event assertion + screenshot |
| SEARCH-A-011 | P1 | a11y | Search dialog | dialog name/description, combobox/listbox/options, active descendant, focus trap | частично в коде | axe + keyboard script, 0 critical |
| SEARCH-P-012 | P2 | performance | Search | debounce/abort; p95 API; index payload budget | debounce/abort есть | p95 <300 ms warm; client index gzip budget recorded |
| TEMPLATE-C-001 | P0 | contract | ArticleShell | title/dek/authors/dates/risk/sources/sections/canonical обязательны | модели фрагментированы | schema validation on build |
| TEMPLATE-C-002 | P0 | contract | High-risk publication | immigration/legal/medical/financial/safety требуют official source, reviewer, verifiedAt и due date | publication gate отсутствует/неполон | fixture rejected with explicit reasons |
| TEMPLATE-C-003 | P1 | contract | Dates | `updatedAt` меняется только при смысловой правке; `verifiedAt` отдельно | не закреплено | changelog fixture + policy test |
| TEMPLATE-R-004 | P1 | render | Metadata | видимы author/editor/reviewer, published/updated/verified и risk notice | непоследовательно | server render assertions по 6 типам |
| TEMPLATE-R-005 | P1 | render | Hero/media | caption, credit, alt и rights id присутствуют | непоследовательно | media contract test |
| TEMPLATE-S-006 | P0 | schema | JSON-LD | schema отражает видимый title/author/dates/FAQ, canonical один | компоненты есть, нет общего parity test | parsed JSON-LD vs page model |
| TOC-C-001 | P0 | contract | Anchors | каждый href `#id` имеет ровно одну видимую цель | нарушено 3 widget anchors | DOM contract test каждой longform page |
| TOC-U-002 | P1 | unit | Slug/id | ids стабильны, уникальны, одинаковы SSR/client | генерация распределена по views | fixtures RU/ES punctuation and duplicates |
| TOC-E-003 | P1 | e2e | Desktop | sticky state, active item, offset, deep link, Back/Forward | scroll spy есть | browser trace at 1440 px |
| TOC-E-004 | P1 | e2e | Mobile | details открывается, выбор закрывает, фокус предсказуем, Back восстанавливает позицию | close/focus/back не реализованы | 390 px trace + focus assertions |
| TOC-A-005 | P1 | a11y | TOC | nav landmark, aria-current, keyboard, contrast, prefers-reduced-motion | частично | axe + keyboard |
| WIDGET-C-001 | P0 | contract | Registry | каждый content widget type имеет renderer и registry row | `calculator/map/promo` объявлены, renderer возвращает null | exhaustive TypeScript/fixture test |
| WIDGET-R-002 | P0 | render | Missing widget | отсутствующий необязательный widget не оставляет TOC link; required блокирует публикацию | нарушено | DOM + publication-gate tests |
| WIDGET-I-003 | P1 | integration | Dynamic data | source, fetchedAt, TTL и stale state видимы для rates/weather/flights | частично/не видимы | fake timers + provider fixtures |
| WIDGET-I-004 | P1 | integration | Errors | loading/empty/error/retry не теряют контент и anchor | реализовано частями | per-widget state matrix snapshots |
| WIDGET-A-005 | P1 | a11y | Interactive widgets | form labels, announced result, table/list alternative, no color-only meaning | неполно | axe + keyboard |
| WIDGET-P-006 | P1 | performance | Third party | widget lazy-load, no CLS, timeout/fallback, no article render block | частично | bundle diff + Web Vitals trace |
| DATA-C-001 | P0 | contract | Rates | official и parallel rates типизированы; source/observedAt/TTL обязательны | source upstream есть, UI metadata неполна | provider schema test |
| DATA-C-002 | P0 | contract | Climate | dataset содержит источник, станцию/регион и normal period | не закреплено | data schema failure on missing fields |
| DATA-C-003 | P0 | contract | Ratings | rating требует source, sample size, observedAt, methodology | 50 place listings + 13 article rating blocks без контракта | build fails or rating hidden |
| DATA-U-004 | P1 | unit | Season score | score вычисляется по опубликованной методологии, version сохраняется | редакционные 0–3 без методологии | deterministic fixtures |
| DATA-U-005 | P1 | unit | Budget | валюта/период/допущения/source/confidence обязательны | статические значения | schema tests + stale handling |
| MAP-E-001 | P1 | e2e | Fullscreen map | filters/search/popup/Escape/list alternative/focus return | функциональность частично есть | desktop/mobile trace |
| MAP-U-002 | P1 | unit | Map search | общая нормализация и алиасы RU/ES/EN | простой lowercase includes | same gold query set as global search |
| MAP-A-003 | P1 | a11y | Inline map | видимый текстовый список позволяет открыть все места без карты | inline alternative отсутствует/неполна | keyboard-only test |
| MAP-P-004 | P2 | performance | Map | Leaflet загружается только при видимости/действии, markers cluster | частично lazy | chunk request trace and budget |
| RELATED-U-001 | P0 | unit | Relevance | score 0 не используется для заполнения квоты | текущий blog helper допускает filler | fixture with unrelated candidates returns empty |
| RELATED-C-002 | P1 | contract | Deduplication | URL не повторяется между inline/sidebar/footer/gallery | локальная дедупликация по блокам | page-level target set assertion |
| RELATED-C-003 | P1 | contract | Publication | только published canonical targets; 404 исключены | фрагментировано | link graph validation |
| SOCIAL-C-001 | P0 | contract | Placement | нет fallback на нерелевантную home/default ленту для destination/place | текущий fallback допускает | unrelated destination returns no feed |
| SOCIAL-C-002 | P1 | contract | Rights | post имеет rights status, source profile, expiry/checkedAt | отдельный registry формируется | build gate and expiry fixture |
| LINK-C-001 | P0 | integration | Internal links | все hub/card/TOC targets отвечают 200 и canonical | 5 guide hub URL дают 404; 3 fragment targets отсутствуют | crawler report, zero P0 failures |
| COPY-C-001 | P0 | lint/content | Placeholders | нет публичных `скоро`, internal editorial notes и lorem/empty promises | найдены destination strings | forbidden-pattern check with allowlist |
| COPY-C-002 | P1 | lint/content | Sensitive language | нет абсолютных обещаний; disclaimer не заменяет источник | ручной контроль | claim registry + reviewer gate |
| VISUAL-V-001 | P1 | visual | Templates | desktop/mobile screenshots для 6 типов и 4 data states | не сняты: browser runtime недоступен | approved baselines at 390/768/1440 |
| VISUAL-V-002 | P1 | visual | Long content | sticky header/TOC не перекрывают H2, tables/maps не выходят за viewport | только code audit | screenshots after deep-link navigation |
| PERF-P-001 | P1 | performance | HTML/RSC | бюджеты по типам, без чрезмерной передачи каталогов в HTML | dev HTML отдельных хабов достигает ~1 MB+; не production metric | production build route-size report |

## Release gate

Релиз контентной переработки допускается, когда:

- все P0 зелёные;
- нет опубликованных high-risk claims без official source/reviewer/verifiedAt;
- crawler не находит 404 и пустых fragment targets в основных хабах;
- search contract проходит по каждому типу и gold query set;
- desktop/mobile/a11y baseline снят на реальном браузере;
- динамические виджеты демонстрируют source/timestamp/TTL/stale state;
- числовые рейтинги либо имеют полный контракт, либо скрыты.

## Текущий пробел проверки

В текущей сессии browser runtime не предоставил браузерную сессию, поэтому визуальные и интерактивные строки отмечены как требующие будущего evidence. Это не заменено другим browser automation инструментом. HTTP-статусы, API-ответы, DOM-якоря в серверном HTML и исходный код проверены отдельно.
