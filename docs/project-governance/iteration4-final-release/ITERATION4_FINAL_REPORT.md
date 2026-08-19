# Iteration 4 — Final release candidate, security, reliability, proof

Generated: 2026-08-19  
Agent branch: `cursor/iteration4-final-release-5475`  
PR: `#33`  
Canonical production: https://www.goargentina.ru

## 1. Launch verdict

**NO-GO** — see `FINAL_LAUNCH_DECISION.md`.

Paid traffic remains forbidden. The product is closer to an operable CORE than
it was before the four-iteration series, but production cannot take real users
and money today.

## 2. Regression of Iterations 1–3

| Iteration | Report treated as truth? | Re-checked live? | Still open? |
|-----------|--------------------------|------------------|-------------|
| 1 Production truth | No — re-probed | Yes: health 503, SHA match, quota + IPv6 | Yes |
| 2 Public product | No — production still old SHA | Visa 200, `/st_location` 404, robots missing candidate disallows | Code fixed, not deployed |
| 3 Operations | No — live persist unproven | I3 CI had grants-last break; I4 restored grants | Live CMS/CRM/RLS unproven |

I3 leftover that I4 fixed: last migration was no longer `*_explicit_data_api_grants.sql`, so `verify-contracts` failed. New restatement keeps organizer UPDATE revoked.

I3 leftover that I4 fixed: three money FAQs failed `--strict-provenance` (`expired_source` on BNA, expired 2026-08-18). Banco Nación `https://www.bna.com.ar/Personas` still 200; dates renewed, no invented rate.

## 3. Release candidate

| Node | SHA |
|------|-----|
| `origin/main` | `81055b1387e0062301ca9c0ae7468cbf782e2511` |
| Production health `gitSha` | same |
| I4 RC |  (not main) |

Prompt asked for one SHA everywhere. That reconciliation is **impossible**
without merging and a Vercel production deploy. Doing either from this agent
would be unsafe: Vercel is blocked, and merging a NO-GO data plane does not
create a GO.

## 4. Production topology

Unchanged and still canonical:

- Host: www.goargentina.ru (apex 308)
- Vercel: team `go-argentina` / project `argentina-travel`
- Supabase: `uooxrypocahomoqzdvzy`
- Direct PG: AAAA only
- Pooler hostname: has A records (owner must point `POSTGRES_URL` at same-ref session pooler)

## 5. What I4 changed (freeze-compatible)

1. **Security:** fail-closed rate limits on auth/booking/lead/waitlist/shop-order.
2. **Security/DB contract:** grants-last restatement after I3.
3. **Content truth:** BNA source windows.
4. **Inventory:** scanner recognizes `checkSecurityRateLimit` / `withRateLimit`.
5. **Evidence:** this directory.

No hotels, forum, shop, own payments, AI, or redesign.

## 6. Quality gates run here

| Command | Result |
|---------|--------|
| `npm run audit:quick` | PASS — tsc, lint, inventory, 498 files / 2443 tests |
| `npm run architecture:check` | PASS |
| `node --test scripts/lib/data-api-grants.test.mjs` | PASS |
| `python3 …/build_manifest.py --strict-provenance` | PASS after BNA refresh |
| Focused rate-limit tests | PASS |
| `npm audit --omit=dev` | 0 production vulns |
| `npm run production-smoke` | not claimed green — production is down |
| `npm run backup:restore:preflight` | FAIL missing manifest (expected) |
| `npm run release:gate` full | not claimed; I3 verify-release was provenance, now locally green. Deploy still blocked |

## 7. Module lifecycle

CORE NOW remains the public portal + marketplace + CMS/admin/CRM/organizer.
Shop/forum stay DORMANT. Own payment POST_LAUNCH `productionEnabled: false`.
`vercel.json` crons are affiliate, platform-maintenance, seo-search-sync,
content-factory-publish — no shop/forum jobs.

## 8. Branch hygiene

Open drafts left in place (useful unmerged work):

- `#30` Sprint 7 + Iteration 1
- `#31` Iteration 2
- `#32` Iteration 3
- `#33` Iteration 4 (this lineage includes 1–3)

Do not delete them. After a future healthy deploy, squash-merge the surviving
line and close superseded PRs.

## 9. Documentation canon

| Live | History |
|------|---------|
| `CURRENT_STATE.md` | `PROJECT_STATE.md` archive |
| This directory | I1/I2/I3 report folders |
| `docs/ops/backup-restore.md` | older readiness JSON under `var/ops` |

## 10. Why this is still NO-GO

GO requires no known P0, healthy production+DB, proven journeys, live RLS,
backup/restore, and a single SHA. Four P0 external blockers remain after all
autonomous work. Softening that to CONDITIONAL GO would fake ready.
