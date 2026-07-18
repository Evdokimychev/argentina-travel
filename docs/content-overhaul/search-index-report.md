# Готовность поиска

## Вывод

Поиск имеет безопасную трёхуровневую схему: Meilisearch → таблица `search_documents` в Supabase/Postgres → статический индекс приложения. Поэтому отсутствие Meilisearch локально не делает поиск неработающим. Однако готовность внешнего индекса в production и полнота покрытия всех 625 sitemap-маршрутов пока не доказаны.

## Фактическое состояние

| Проверка | Состояние | Доказательство |
| --- | --- | --- |
| Публичный маршрут поиска | присутствует в приложении | `src/lib/search/search-client.ts`, `/api/search` |
| Статический fallback | реализован | `src/lib/search/search-query.ts` |
| Postgres fallback | реализован при настроенном Supabase | `search_site_documents` и `search_documents` |
| Meilisearch | локально не настроен | `var/ops/search-readiness-last.json`: `configured=false` |
| Health Meilisearch | не выполнялся | `meiliHealthy=null` |
| Число документов Meilisearch | неизвестно | `documentCount=null` |
| Публикационная фильтрация базы | действует до публичных ссылок и sitemap | `publication-quality.ts`, public link contract |
| Полнота статического индекса | не доказана | типы `collection`, `itinerary`, `author` и flight landing отсутствуют в `SearchResultType` |

Последний readiness-отчёт от 16 июля 2026 года имеет `ok=true`, потому что отсутствие Meilisearch допустимо локально. Это не является подтверждением production-настройки.

## Что нужно проверить перед запуском

1. Запустить `npm run search:readiness` в production-подобном окружении без вывода секретов.
2. Если Meilisearch выбран: подтвердить host, API key, `/health` и число документов.
3. Выполнить полную переиндексацию после финального content freeze.
4. Сверить, что 451 изолированная запись базы не попала в результаты и что все выбранные для поиска публичные типы действительно представлены.
5. Проверить запросы на русском и по aliases: «Хухуй/Жужуй», «Ушуайя/Усуайя», «NOA», «SUBE», «DNI», «синий доллар».
6. Проверить нулевой результат, опечатку, фильтр типа и переход на canonical URL.
7. Зафиксировать время обновления индекса и владельца инцидента.

В `content-inventory.csv` все 387 маршрутов вне детального KB-инвентаря намеренно имеют `search_indexed=not_verified`, а не автоматическое `yes`; разрешающий robots сам по себе не доказывает присутствие в поисковом индексе. До этих действий строка `search:meilisearch-production` в `issue-ledger.csv` остаётся `blocked_external`. Публичный запуск может использовать проверенный static/Postgres fallback, но нельзя обещать полноту или возможности внешнего индекса, которые не подтверждены.
