# RISK_REGISTER

| ID | Risk | Likelihood | Impact | Evidence | Mitigation | Trigger/owner | State |
|---|---|---:|---:|---|---|---|---|
| R-001 | Production REST and direct PG remain unavailable | high | critical | health 503/down | owner incident diagnosis; restore access; validate credentials/billing/network; bounded rollback | any health 503 / owner+ops | active P0 |
| R-002 | Outage is cached/rendered as empty or 404 | high | high | live APIs 200 empty; excursion false-empty | typed resolution, no cache poison, route/fault tests, 503 analytics | public_404/public_503 spike / engineering | active P1 |
| R-003 | Production data cannot be restored | medium | critical | PITR unconfirmed, rehearsal not_run | encrypted logical backup, offline keys, disposable restore rehearsal | backup failure / owner | active P1 |
| R-004 | Wrong Supabase/Vercel account is used as evidence | high | high | canonical targets absent/403 | never use proxy project; record ref/scope/time; restore read-only OAuth | connector mismatch / owner | active |
| R-005 | Dirty worktree causes mixed release or loss of owner changes | high | high | 76 entries across domains | scoped diff, no reset/delete, isolated commit/candidate | before stage/deploy / engineering | active |
| R-006 | Commercial copy overstates marketplace/verification/payment | high | high | footer production copy; capability proof incomplete | capability audit, hide/qualify claims, legal review where needed | public copy scan / product | active P1 |
| R-007 | Migration metadata diverges from applied journal | medium | critical | baseline 102 vs build 107 without live DB proof | checksum reconciliation before DDL/release | migration action / ops | active P1 |
| R-008 | Growth decisions use stale analytics evidence | high | medium | readiness 0/D, stale/unbound reports | health-bound producer, consent QA, conversion verification | campaign launch / analytics | active |
| R-009 | Vercel production direct-PG configuration diverges from verified local runtime | high | critical | local direct-PG healthy; production direct-PG unavailable | immutable deployment logs/env-name audit, connection diagnostic, no secret values in evidence | health mismatch / ops | active P0 |
