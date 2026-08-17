# Sprint 5 — Business SLO / SLI

Простые операционные цели. Не enterprise-бюрократия.

| Domain | SLI | Target | Detect | Action |
|---|---|---|---|---|
| PUBLIC AVAILABILITY | `/api/health` status ≠ down | 99.5% rolling 7d | health + alerting | fail-closed catalogs, incident runbook |
| LEAD DELIVERY | lead row created + outbox attempt | attempt ≤ 5 min after submit | ops outbox + admin leads | retry / dead-letter alert |
| PARTNER FEED FRESHNESS | partner sync age | per partner policy in ops | `/api/health/partners` + sync jobs | pause CTA / degrade inventory |
| BOOKING REQUEST PROCESSING | native booking create success | errors classified, no silent drop | booking_error `error_class` + ops | operator queue |
| ANALYTICS INGEST | controlled event upsert | no PII; dedupe by `event_id` | `/api/analytics/events` + admin freshness | stop dual-count; fix consent |

## Alerting (actionable minimum)

- site hard down
- database / direct Postgres down
- partner critical failure
- cron repeated failure
- lead notification failure
- outbox exhausted retries
- unusual booking failure rate (`error_class` spikes)

Spam alerts are not success. Each alert must name the next human action.
