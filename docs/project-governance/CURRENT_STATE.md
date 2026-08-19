# CURRENT_STATE — GoArgentina (machine + agent entry)

> **Read this first.** Historical deployment narrative lives in `PROJECT_STATE.md` below the banner / archive sections. Do not treat month-old SHAs in history as current.

| Field | Value |
|-------|--------|
| Generated | 2026-08-19 (Iteration 6) |
| Certification | **NOT CERTIFIED** — I5 + I6 pre-merge |
| Launch verdict | **NO-GO** — `docs/project-governance/iteration6-production-cutover/FINAL_LAUNCH_DECISION.md` |
| `origin/main` tip | `81055b1387e0062301ca9c0ae7468cbf782e2511` |
| Production `gitSha` | `81055b1387e0062301ca9c0ae7468cbf782e2511` (matches main; **not** I5/I6 candidates) |
| I6 candidate | `cursor/iteration6-final-integration-5475` (I5 cumulative + CI/evidence/geo/redirect fixes) |
| `audit:quick` on I6 | 500 files / 2454 tests PASS |
| Production URL | https://www.goargentina.ru (apex 308 → www) |
| Production health | **DOWN** — 503; DB `dependency_unavailable` / `dependency_timeout` |
| Live `/api/search` | **500** on production SHA (I5/I6 candidate fixes not deployed) |
| Canonical Vercel | team `go-argentina` / project `argentina-travel` |
| Vercel deploy | not attempted this turn; prior "Account is blocked" may be stale — verify on next CI deploy |
| Canonical Supabase | `uooxrypocahomoqzdvzy` |
| Live journal / RLS | **NOT_PROVEN** |
| Backup / restore | not proven |
| CI evidence pipeline | **fixed in I6 candidate** (SHA-bound staging; stale artifact regression test) |
| Paid traffic | **NO-GO** |

## Active product (CORE NOW)

Unchanged from I5. Public HTML shells may 200 from static fallbacks; APIs and search on live SHA are unhealthy.

## Agent entry

1. Constitution: `docs/project-governance/GOARGENTINA_MASTER_GOAL_V6_28.07.2026.md`
2. **This file**
3. Iteration 6: `docs/project-governance/iteration6-production-cutover/ITERATION6_FINAL_REPORT.md`
4. Iteration 5: `docs/project-governance/iteration5-deep-certification/ITERATION5_FINAL_REPORT.md`
5. Runbook: `docs/project-governance/RELEASE_RUNBOOK.md`

## External blockers

1. Restore Supabase on `uooxrypocahomoqzdvzy` (quota/connectivity).
2. IPv4 session pooler URL on Vercel if direct host remains IPv6-only.
3. Confirm Vercel deploy permissions for team `go-argentina`.
4. Production backup secrets + disposable restore rehearsal.
5. Then: merge I6, deploy, live RLS, two-pass production smoke.

## Open PRs

`#30`–`#34` remain open until main confirmed post-merge. I6 supersedes with single integration branch.
