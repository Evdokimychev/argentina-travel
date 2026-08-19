DECISION: NO-GO

Date: 2026-08-19  
Canonical production: https://www.goargentina.ru  
`origin/main`: `81055b1387e0062301ca9c0ae7468cbf782e2511`  
Production `gitSha`: `81055b1387e0062301ca9c0ae7468cbf782e2511`  
Iteration 4 candidate: `412b7b5b94c39db4eaaebe25de91f10d6538f4e9` on `cursor/iteration4-final-release-5475` (PR `#33`)

This is not a style verdict. Production health is **503 down**. The Data API
returns quota failure, direct Postgres is IPv6-only from IPv4 runtimes, and
Vercel cannot take a new production deployment. GO criteria require a healthy
production data plane, proven RLS, proven backup/restore, and one SHA across
main / RC / production. None of those are true today.

## Why not CONDITIONAL GO

CONDITIONAL GO is allowed only when leftovers are non-security, non-data-loss,
and do not break core. The remaining blockers are P0:

1. Supabase REST/Auth **402 `exceed_egress_quota`** on `uooxrypocahomoqzdvzy`.
2. Direct `db.<ref>.supabase.co` has **AAAA only**; IPv4 `ENETUNREACH`.
3. Vercel team `go-argentina` new deploys: **Account is blocked**.
4. Encrypted backup workflow fails because `production-backup` secrets are empty.
   Restore rehearsal is `not_run`.

A public HTML 200 from static/typed fallbacks is not a healthy product.

## What Iteration 4 did autonomously

- Fail-closed rate limits on auth, booking, lead, waitlist and shop-order writes.
- Restated explicit Data API grants after the Iteration 3 organizer lock.
- Refreshed three expired Banco Nación source windows after a live URL check.
- Re-verified Iterations 1–3 reports against live production. None were treated
  as complete just because a report or CI job existed.

## What would flip this to GO

Owner clears quota, adds a same-ref IPv4 session pooler, unblocks Vercel,
deploys this lineage, then live-proves: health 200, RLS, backup+restore,
critical persist journeys, analytics dispatch.

Until then: no paid traffic, no production promotion of this RC.
