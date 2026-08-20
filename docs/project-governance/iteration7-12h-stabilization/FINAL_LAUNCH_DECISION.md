# FINAL LAUNCH DECISION — Iteration 7 (CANDIDATE)

Generated: 2026-08-20

## DECISION: NO-GO

Candidate SHA: 

Status lifecycle: **CANDIDATE** (not FINAL production certification).

Internal release blockers from I6 CI are fixed in this branch. Live data plane / production cutover remain blocked externally.

## Why NO-GO

1. Production DB still down (`/api/health` 503; sitemap hangs on live).
2. Live RLS / Auth / backup / restore not proven.
3. `main` / production SHA still `81055b13` — candidate not merged/deployed.
4. Fresh GitHub CI on I7 head not yet green at decision write time (must re-check after push).

## What I7 closed that I1–I6 missed

| ID | Defect | Why missed | Fix |
|----|--------|------------|-----|
| P0-I7-001 | Invalid `/st_tour/patagonia-:path*` broke `next build` | I6 report written before fresh CI | Valid exact redirects + middleware prefix matchers + path-to-regexp tests |
| P0-I7-002 | Lighthouse artifacts still stale-uploadable | I6 only fixed release-gate paths | Run-scoped performance staging |
| P1-I7-001 | Sitemap hang under DB outage / N+1 cities | Treated as timeout only | Collector budgets + static fallback |
| P1-I7-002 | platform-maintenance abort-all on first failure | Cron docs incomplete | Per-task timeout/isolation |
| P1-I7-003 | ~1 GiB research dumps tracked | Assumed gitignored | Untrack + ignore + vercelignore |
| P2-I7-001 | Forum/shop raw `error.message` | Dormant surface skipped | `unexpectedPublicApiError` |
| P2-I7-002 | Typing TTL constants inconsistent | Assumed cron = correctness | Document read TTL vs cleanup |

## Scorecard

| Area | Result |
|------|--------|
| Build (local clean) | PASS |
| Redirect syntax | PASS |
| Evidence integrity (release + LH) | PASS |
| Cron isolation | PASS |
| Repo efficiency (current tree) | PASS (history still heavy) |
| Supabase live | BLOCKED_EXTERNAL |
| RLS live | FAIL / blocked |
| Backup/restore | FAIL / blocked |
| Production cutover | FAIL (not attempted) |
| Public live data truth | FAIL (old SHA) |

## Owner actions remaining

1. Restore Supabase `uooxrypocahomoqzdvzy` connectivity/quota.
2. Confirm Vercel deploy after green I7 CI.
3. Backup secrets + restore rehearsal.
4. Merge cumulative candidate → deploy exact SHA → live RLS + two-pass smoke.
