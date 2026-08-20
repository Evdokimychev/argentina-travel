# CURRENT_STATE — GoArgentina (machine + agent entry)

> **Read this first.** Historical narrative lives in `PROJECT_STATE.md`. Do not treat month-old SHAs as current.

| Field | Value |
|-------|--------|
| Generated | 2026-08-20 (Iteration 7) |
| Certification | **NOT CERTIFIED** — I7 candidate |
| Launch verdict | **NO-GO** — `docs/project-governance/iteration7-12h-stabilization/FINAL_LAUNCH_DECISION.md` |
| `origin/main` tip | `81055b1387e0062301ca9c0ae7468cbf782e2511` |
| Production `gitSha` | `81055b13` (matches main; not I7 candidate) |
| I7 candidate | `cursor/iteration7-12h-stabilization-5475` (I5+I6 cumulative + I7 fixes) |
| Prior I6 PR | `#35` — contracts PASS; release FAIL on invalid `:path*` (fixed in I7) |
| `audit:quick` on I7 | 504 files / 2464 tests PASS |
| Local clean `next build` | PASS (CI placeholder env) |
| Production URL | https://www.goargentina.ru |
| Production health | **DOWN** — 503; DB unavailable; sitemap times out |
| Canonical Vercel | team `go-argentina` / project `argentina-travel` — preview failure on #35 was **build error**, not proven account block |
| Canonical Supabase | `uooxrypocahomoqzdvzy` |
| Live RLS / backup | **NOT_PROVEN** |
| Paid traffic | **NO-GO** |

## Agent entry

1. Constitution: `docs/project-governance/GOARGENTINA_MASTER_GOAL_V6_28.07.2026.md`
2. **This file**
3. Iteration 7: `docs/project-governance/iteration7-12h-stabilization/ITERATION7_FINAL_REPORT.md`
4. Iteration 6: `docs/project-governance/iteration6-production-cutover/` (pre-CI; superseded on build claim)

## External blockers

1. Restore Supabase `uooxrypocahomoqzdvzy`.
2. Green I7 CI → merge → deploy exact SHA.
3. Backup secrets + restore rehearsal.
4. Live RLS + two-pass production smoke.

## Open PRs

`#30`–`#35` remain until main confirmed. I7 branch is the active cumulative candidate.
