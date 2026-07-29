# MASTER_PLAN — living plan

Обновлён: 2026-07-29 00:16 ART. План изменён по build/runtime evidence: REST root cause подтверждён как egress quota, а production direct-PG требует отдельной диагностики, потому что тот же путь локально исправен.

## Правило выбора пакета

`safety/data loss → production availability → truth/false 404 → critical journey → data integrity → admin → UX/perf → growth → new features`.

## Текущий порядок

| Order | Work packet | Severity | Exit evidence | State |
|---:|---|---|---|---|
| 0 | Freeze evidence: identity, dirty ownership, production SHA, infra scopes | P0 support | PROJECT_STATE + exact SHA/scope/timestamp | done |
| 1 | Restore/diagnose production Supabase REST + direct PG | P0 | both required health checks 200; root cause and incident timeline; no secret exposure | REST root cause confirmed: egress quota; owner action required. Direct-PG prod-only failure unresolved |
| 2 | Reconcile 107-file migration journal/RLS/grants against canonical ref | P0/P1 | read-only checksum parity, advisors, logs, backup decision | blocked by Supabase access/data plane |
| 3 | Fail-closed public catalog resolution | P1 | outage→503/LKG, confirmed empty→200, confirmed missing→404; route/unit tests; no cache poison | implemented; local tests/build/browser/smoke pass |
| 4 | Candidate isolation and preview | P1 | scoped commit, immutable preview ID/URL, browser QA 390/1440, smoke bound to commit | in progress; Vercel MCP scope remains a metadata blocker |
| 5 | Production promote and post-deploy proof | P0/P1 | deployment ID/SHA, health, catalog/detail parity, all-card crawl, rollback | pending |
| 6 | Product truth: marketplace, organizer, payment, messaging claims | P1 | capability matrix + copy/visibility + tests | pending |
| 7 | Backup/restore and incident recovery | P1 | encrypted backup evidence + disposable restore rehearsal | owner setup required; runbook exists |
| 8 | Analytics/consent/conversion deployment binding | P1 | healthy SHA-bound report, clean-browser consent test | pending |
| 9 | Regenerate route/interaction/data matrix and close stale inventory gaps | P1/P2 | current counts, owners, states and test coverage | pending |

## Первый безопасный work packet

**WP-001: Fail-closed catalog resolution.** Он выбран, потому что P1 уже воспроизведён, изменение обратимо, не требует DDL и не зависит от восстановления production для локальной реализации.

Scope:

- typed `ok/data | confirmed empty/missing | unavailable` на data boundaries;
- `/api/tours`, `/api/v1/tours`, `/api/excursions`, `/api/v1/excursions`, detail routes;
- public tour resolver propagation;
- no caching operational errors as absence;
- route/fault matrix tests;
- preview QA и production-equivalent smoke после candidate isolation.

Not in scope: schema/migrations, checkout/payment, partner write calls, production deploy before P0 recovery.

## Почему план изменён

До live baseline приоритетом был semantic catalog gap. После доказанного simultaneous REST/direct-PG outage он остаётся первым независимым кодовым пакетом, но deployment перенесён после восстановления data plane и migration parity. Новые функции, дизайн и SEO не допускаются раньше P0/P1 recovery.
