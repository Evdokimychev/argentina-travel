# Матрица проверок контента

| Область | Проверка | Частота | Критерий | Текущее доказательство | Статус |
| --- | --- | --- | --- | --- | --- |
| Публичный текст | strict editorial crawl по sitemap | каждый релиз | 0 ошибок | `var/ops/public-editorial-audit.json`: 625 страниц, 0 ошибок | pass |
| База знаний | публикационный gate | каждое изменение KB | ни одного публичного blocker | `publication-quality.ts`, public link contract | pass для 238 публичных |
| Изоляция сырья | sitemap/search/public links | каждое изменение KB | 451 quarantined не публикуются | inventory + sitemap | pass локально |
| Генератор | CSV, обязательные файлы, KB counts, route titles/scores, widget paths | каждое изменение генератора | тесты проходят | `src/lib/content-overhaul-inventory.test.ts` | pass, 6/6 |
| Типы | TypeScript | каждый PR | 0 ошибок | `npx tsc --noEmit` | pass после общего исправления |
| Unit/contracts | `npm run audit:quick` | каждый релиз | все тесты проходят | свежий прогон: 246 файлов, 1245 тестов | pass; повторить после общего content freeze |
| Production build | Next production build | каждый релиз | сборка завершается и production server отдаёт sitemap | свежая `.next-production` сборка; sitemap 625 | pass |
| Внутренние KB-ссылки | related + wikilinks против ID | каждое изменение KB | 0 broken | `broken-links.csv` | pass для внутреннего KB-графа; внешние URL не проверены сетью |
| Дубли | exact normalized title/body | еженедельно | каждое совпадение имеет решение | `duplicate-content-report.csv` | review_required по найденным группам |
| Тонкие материалы | опубликованный текст ≥ gate | каждое изменение KB | thin не public | `thin-content-report.csv` | 163 quarantined на текущем срезе |
| Источники | sensitive + source presence | каждое изменение sensitive | 0 public missing source | `sensitive-claims.csv` | gate работает; item-level review остаётся |
| Медиа metadata | полный audit | каждый релиз | 0 новых high, все public managed | media rights report | blocked: 49 high, 30 medium |
| Медиа юридически | ручная проверка лицензии | до публикации/замены | основание действительно | не выполняется автоматикой | review_required |
| Поиск fallback | русские запросы и aliases | каждый релиз | релевантный canonical результат | static/Postgres fallback в коде | ручной browser QA требуется |
| Meilisearch | readiness в production | перед включением | configured, healthy, count reconciled | configured=false локально | blocked_external |
| Redirects | redirect contracts | каждый релиз | source → один canonical 308 | `redirect-map.csv`, contract tests | implemented; повторить live |
| Виджеты | registry + unknown key | каждое изменение контента | нет технического fallback | `widget-registry.csv` | P1 для неизвестного ключа |
| Мобильное чтение | 320 px, zoom 200% | каждый шаблон | нет обрезки/потери действия | browser QA | review_required после финальной сборки |
| Доступность | клавиатура, alt, формы | каждый шаблон | основной сценарий доступен | automated + manual QA | финальная ручная проверка требуется |
| Production smoke | реальные public URL | после деплоя | 200/canonical, no 5xx, формы честны | ещё не выполнен для финального релиза | blocked_external |

`pass на контрольном срезе` означает, что после параллельных изменений проверку нужно повторить; это не бессрочная гарантия.
