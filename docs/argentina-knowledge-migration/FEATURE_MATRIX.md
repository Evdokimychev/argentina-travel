# Feature Matrix

| Возможность | Knowledge | Travel до | Итоговая реализация | Статус |
|---|---|---|---|---|
| Source registry | JSON | evidence sources | operational `ingestion_sources` + admin | DONE |
| Telegram | Telethon | отсутствовал | Teleproto MTProto, albums/media/checkpoint | DONE |
| HTML | requests/Trafilatura | scripts | Cheerio adapter + selectors/canonical | DONE |
| RSS/Atom | feedparser | частично | typed XML adapter | DONE |
| Sitemap | prototype | scripts | discovery + bounded HTML fetch | DONE |
| JSON API | prototype | partner-specific | field-mapped generic adapter | DONE |
| YouTube | yt-dlp prototype | отсутствовал | RSS/oEmbed with graceful transcript status | DONE |
| Manual input | CLI/file | CMS direct | manual source through shared pipeline | DONE |
| Browser rendering | отсутствовал | Playwright dev only | use only as future custom adapter when a proven source requires it | NOT APPLICABLE |
| Scheduling | отсутствовал | Vercel cron | due-source dispatcher every 15 minutes | DONE |
| Locks/idempotency | file state | job patterns | active-run unique index + idempotency keys | DONE |
| Cancel/retry/DLQ | partial | ops patterns | cancel flag, exponential backoff, retry cap, dead letter | DONE |
| Checkpoints | JSON | mixed | source/run JSON checkpoints | DONE |
| Raw/media | filesystem | Storage | immutable rows + private Storage bucket | DONE |
| Normalization | Python Article | CMS bodies | one normalized TS document | DONE |
| HTML cleanup | Trafilatura | mixed | DOM extraction to plain normalized text | DONE |
| Language/translation | language field | AI integrations | source language + reviewed structured translation | DONE |
| Geography/category/tags | Python rules | KB taxonomy | deterministic rules + AI enrichment | DONE |
| Entity extraction | отсутствовал | mixed | structured AI entities | DONE |
| Quality/freshness | Python score | freshness checks | explainable score + sensitive stale flags | DONE |
| Exact/near dedupe | SHA/shingles | inventory tools | hashes, shingles, duplicate links and comparison UI | DONE |
| Existing content update | отсутствовал | CMS revisions | related-page detection + versioned update proposal | DONE |
| Prompts/models | отсутствовали | env/code | version table + admin + fallback model | DONE |
| Moderation | status files | CMS admin | candidate queue, edit/approve/reject/defer/reprocess | DONE |
| Publication | package export | CMS | draft only, target mapping, source links/search workflow | DONE |
| Knowledge/blog/place/map | export knowledge | separate entities | knowledge/blog/place/destination/guide mapping | DONE |
| Roles | отсутствовали | broad capabilities | 20 granular ingestion capabilities + backend checks | DONE |
| Audit | reports | admin log | source/run/prompt/moderation/publication audit | DONE |
| Monitoring | JSON report | health/cron | overview, heartbeat, stuck jobs, provider readiness | DONE |
| Data migration | manual exports | bridge importer | idempotent ledger/checksum script | DONE |
| Production shadow/cutover | none | production | controlled runbook | BLOCKED EXTERNALLY |
