# Iteration 4 — Final release scorecard

Status values: PASS | DEGRADED | FAIL | BLOCKED_EXTERNAL | N/A

| Area | Status | Evidence |
|------|--------|----------|
| Git/Release | DEGRADED | `origin/main` = production SHA `81055b13`. RC is I4 branch, not main. One lineage I1⊂I2⊂I3⊂I4 in PR `#33`. Cannot reconcile three SHAs while Vercel is blocked. |
| Vercel | DEGRADED | Canonical team `go-argentina` / project `argentina-travel`. Production artifact `81055b13` still serves www. New deploys: Account is blocked. |
| Supabase | FAIL | Ref `uooxrypocahomoqzdvzy` proven. REST without key 401 + `sb-project-ref`. Data plane quota + IPv6-only direct PG. |
| DB/Migrations | DEGRADED | Repo journal 111 files, latest `20260819120000_final_explicit_data_api_grants`. Live journal/parity BLOCKED_EXTERNAL. Health metadata is not DB proof. |
| RLS/Security | DEGRADED | Source/IDOR/cron/SSRF/rate-limit contracts PASS. Live RLS and grants on production NOT_PROVEN. |
| Public Product | DEGRADED | Home/destinations/places/guide/KB/blog/map HTML 200. Catalog APIs 503. Visa archive and `/st_location` fixes not live (old SHA). |
| Marketplace | FAIL | `/api/tours` 503, `/api/excursions` 503 `catalog_unavailable`. Partner health all down. Cannot certify dates/prices/currency. |
| SEO | DEGRADED | Production robots missing candidate `/api/` and KB search disallows. Apex 308→www. Visa slug still 200 self-canonical on old SHA. |
| Mobile | DEGRADED | Production shells render. Live catalog/mobile booking journeys cannot be completed. No new a11y regression introduced in I4. |
| CMS | DEGRADED | I3 code: revalidate + unpublish. Live persist NOT_PROVEN. Cutover flags remain false. |
| Organizer | DEGRADED | I3 ownership/RPC/409. `/organizer` 307 to sign-in. Live approval E2E NOT_PROVEN. |
| CRM | DEGRADED | I3 transitions + audit. Lead persist against production DB BLOCKED_EXTERNAL. |
| Reliability | DEGRADED | Health truthful 503; 12 concurrent health probes all 503, no hang (p95 2.25s). Provider outage does not crash public HTML. Restore unproven. |
| Backup/Restore | FAIL | Scheduled backup 2026-08-18 failed: empty `BACKUP_*` secrets. Preflight: `BACKUP_MANIFEST_PATH is required`. PITR unconfirmed. |
| Performance | DEGRADED | Home 0.78s/182KB; blog 0.50s/449KB; map 0.42s/451KB; Iguazu article 0.56s/649KB. Catalog APIs fail fast. No Lighthouse 100 chase. |
| Observability | DEGRADED | Health exposes `gitSha`, env, dependency class, no secrets. Partner health 503 with per-source down. Live Sentry stream BLOCKED_EXTERNAL. |
| Analytics | DEGRADED | Consent-gated emitters and funnel names exist. GET `/api/analytics/events` 405. Downstream YM/GTM proof BLOCKED_EXTERNAL. |

## Gate totals (this scorecard)

- PASS: 0 areas fully unblocked
- DEGRADED: 14
- FAIL: 3 (Supabase data plane, marketplace live, backup/restore)
- BLOCKED_EXTERNAL: folded into FAIL/DEGRADED rows above
