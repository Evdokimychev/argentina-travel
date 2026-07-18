# Argentina Knowledge Collector

Коллектор `/Users/Study/Projects/Argentina-Knowledge-Collector` формирует пакет `argentina-travel-knowledge-v2`. Админский модуль `/admin/content/knowledge` проверяет пакет, показывает качество и происхождение кандидатов и создаёт выбранные статьи как CMS-черновики.

## Локальный сценарий

```bash
cd /Users/Study/Projects/Argentina-Knowledge-Collector
.venv/bin/python collector.py import-sources
.venv/bin/python collector.py export-site
```

Загрузите `exports/argentina_travel/knowledge-package.json` через раздел «Контент и сайт -> База знаний».

## Автоматическая доставка

Создайте в `/admin/system/api-keys` отдельный ключ с областями `content:write` и `content:status`. В `.env` Collector укажите URL сайта и ключ, затем выполните:

```bash
.venv/bin/python collector.py sync-site --dry-run
.venv/bin/python collector.py sync-site
.venv/bin/python collector.py sync-status
```

Маршруты интеграции:

- `POST /api/v1/content/knowledge` - идемпотентно создаёт до 100 CMS-черновиков.
- `POST /api/v1/content/knowledge/status` - возвращает статус и публичный URL до 200 документов.

## Гарантии

- Импорт требует `content.edit`.
- Автопубликации нет: создаются только `blog`-документы со статусом `draft`.
- Повторный CMS-id не перезаписывает существующий документ.
- Происхождение сохраняется в `body.collector` и переживает последующие сохранения редактора.
- Событие записывается в audit log как `cms.knowledge_import`.
- Автоматический импорт требует отдельной области API-ключа, учитывается в rate limit и записывается как `cms.knowledge_api_import`.
- Collector не получает Supabase service role и не может публиковать материалы.

## Проверка

```bash
npx vitest run src/lib/cms/knowledge-import.test.ts src/lib/public-api/keys.test.ts
npx tsc --noEmit --pretty false
```
