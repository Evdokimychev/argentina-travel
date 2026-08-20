# Cron SLA Matrix — Iteration 7

| Route | Vercel schedule | Required cadence (product) | Actual | Notes |
|-------|-----------------|----------------------------|--------|-------|
| `/api/cron/platform-maintenance` | `0 3 * * *` | daily housekeeping | daily | Orchestrator; now per-task timeout + isolation |
| `/api/cron/affiliate-sync` | `0 4 * * *` | daily | daily | Direct schedule |
| `/api/cron/seo-search-sync` | `30 5 * * *` | daily | daily | Direct schedule |
| `/api/cron/content-factory-publish` | `0 6 * * *` | daily | daily | Direct schedule |
| cleanup-typing | via maintenance | continuous TTL on read | daily cleanup | Read path uses 10s TTL; cleanup 15m housekeeping |
| booking-reminder-24h | via maintenance | calendar-day before start | daily | BA timezone “tomorrow”; not exact T-24h |
| cms/publish-scheduled | via maintenance | day-bucket publish | daily | Exact-minute schedules not supported on Hobby |
| privacy/process | via maintenance | daily | daily | Critical subtask |
| search/reindex | via maintenance | daily ok | daily | Non-critical; timeout isolated |
| email-retry | via maintenance | ideally faster | daily | Documented latency debt under Hobby |

## Orchestrator isolation (fixed I7)

Before: sequential `fetch` + `response.json()`; one hang/invalid JSON aborted remaining tasks.

After:

- AbortController per subtask (default 12s, longer for privacy/reindex)
- non-JSON tolerated
- critical vs non-critical failures
- siblings continue after independent failures
