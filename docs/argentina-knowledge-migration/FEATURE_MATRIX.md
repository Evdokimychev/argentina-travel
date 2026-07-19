# Feature Matrix

| Возможность | Argentina Knowledge | Argentina Travel | Дублирование | Лучший вариант | Итоговая реализация | Статус переноса |
|---|---|---|---|---|---|---|
| Источники | JSON config | content governance | частичное | Travel DB/admin | ingestion source registry | IN PROGRESS |
| Telegram | Telethon MTProto | нет ingestion | нет | адаптированный MTProto/Bot adapter | server adapter + env secret ref | TODO |
| HTML/RSS | Trafilatura/feedparser | отдельные scripts | частичное | общий TS adapter contract | HTTP/RSS/sitemap adapters | TODO |
| YouTube | yt-dlp/transcript | нет | нет | API/feed adapter | YouTube adapter | TODO |
| Ручной запуск | CLI | admin/cron patterns | да | Travel admin API | source run endpoint | TODO |
| Расписания | отсутствуют | Vercel cron | нет | Travel cron | due-source dispatcher | TODO |
| Checkpoint | JSON | DB patterns | нет | Supabase | per-source JSON checkpoint | TODO |
| Run log/errors/retry | JSON report | ops/audit | частичное | Supabase + ops | runs and processing steps | TODO |
| Нормализация | Python Article | CMS bodies | частичное | shared TS document model | normalized documents | TODO |
| Дедупликация | fingerprint/shingles | content inventory tools | частичное | canonical/hash + similarity | duplicate relations, no auto-delete | TODO |
| География/категории | rule dictionaries | KB/place taxonomy | частичное | Travel taxonomy | deterministic classifier | TODO |
| AI-анализ | отсутствует | OpenAI integrations | нет | central ingestion prompt | optional structured analysis | TODO |
| Модерация | statuses/reports | CMS/admin | частичное | Travel admin | candidate queue | TODO |
| Публикация | export only | CMS workflow/search | нет | Travel CMS | draft/knowledge/blog targets | TODO |
| Аудит/права | отсутствуют | capabilities/audit | нет | Travel authorization | granular ingestion capabilities | TODO |
| Monitoring | reports only | health/cron ops | частичное | Travel ops | ingestion health summary | TODO |
| Миграция | Markdown/JSON | importer | временное | idempotent migration ledger | one-time migration script | TODO |
