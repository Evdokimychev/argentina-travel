# FINAL LAUNCH DECISION — Iteration 7 (CANDIDATE)

Generated: 2026-08-20

## DECISION: NO-GO

Candidate branch: `cursor/iteration7-12h-stabilization-5475` (PR #36).  
Candidate SHA: `c46dd7d785de333b8dbc3259b37bdfe8a145fd9c`.

Status lifecycle: **CANDIDATE** (not FINAL production certification).

## Why NO-GO

1. Production DB still down (`/api/health` 503; sitemap hangs on live).
2. Live RLS / Auth / backup / restore not proven.
3. `main` / production SHA still `81055b13` — candidate not merged/deployed.
4. **Vercel account is blocked** (`Account is blocked` / deployment-blocked knowledge URL) — **BLOCKED_EXTERNAL**, owner action. Not an app build regression.
5. Fresh GitHub CI must go green after provenance quarantine + inventory refresh (this revision).

## What I7 closed that I1–I6 missed

| ID | Defect | Why missed | Fix |
|----|--------|------------|-----|
| P0-I7-001 | Invalid `/st_tour/patagonia-:path*` broke `next build` | I6 report written before fresh CI | Valid exact redirects + middleware prefix matchers + path-to-regexp tests |
| P0-I7-002 | Lighthouse artifacts still stale-uploadable | I6 only fixed release-gate paths | Run-scoped performance staging |
| P0-I7-003 | `strict-provenance` 64/90 calendar debt | Assumed I4 BNA refresh covered corpus | Honest `site_ready:false` quarantine of 26; no fake dates |
| P0-I7-004 | Vercel account blocked | Treated as app/deploy health | Documented BLOCKED_EXTERNAL |
| P1-I7-001 | Sitemap hang under DB outage / N+1 cities | Treated as timeout only | Collector budgets + static fallback |
| P1-I7-002 | platform-maintenance abort-all on first failure | Cron docs incomplete | Per-task timeout/isolation |
| P1-I7-003 | ~1 GiB research dumps tracked | Assumed gitignored | Untrack + ignore + vercelignore |
| P1-I7-004 | Stale product-surface inventory | Missed after API hash edits | `inventory:generate` |
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
| Knowledge strict-provenance | PASS after quarantine (64/64) |
| Product inventory check | PASS after regenerate |
| Supabase live | BLOCKED_EXTERNAL |
| RLS live | FAIL / blocked |
| Backup/restore | FAIL / blocked |
| Vercel account / deploy | BLOCKED_EXTERNAL (account blocked) |
| Production cutover | FAIL (not attempted) |
| Public live data truth | FAIL (old SHA) |

## Owner actions remaining

1. Restore Supabase `uooxrypocahomoqzdvzy` connectivity/quota.
2. Unblock Vercel account (spend/quota/policy).
3. Fact-check and restore the 26 quarantined sensitive KB articles (see `PROVENANCE_QUARANTINE.md`).
4. Backup secrets + restore rehearsal.
5. After green CI + healthy data plane: merge cumulative candidate → deploy exact SHA → live RLS + two-pass smoke.

## Explicit non-claims

- Do **not** claim Vercel OK while account is blocked.
- Do **not** claim GO / CERTIFIED while DB down and live proofs missing.
- Do **not** treat quarantine as editorial re-verification.
