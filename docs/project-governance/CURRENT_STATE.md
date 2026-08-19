# CURRENT_STATE — GoArgentina (machine + agent entry)

> **Read this first.** Historical deployment narrative lives in `PROJECT_STATE.md` below the banner / archive sections. Do not treat month-old SHAs in history as current.

| Field | Value |
|-------|--------|
| Generated | 2026-08-19 (Iteration 4) |
| Launch verdict | **NO-GO** — `docs/project-governance/iteration4-final-release/FINAL_LAUNCH_DECISION.md` |
| `origin/main` tip | `81055b1387e0062301ca9c0ae7468cbf782e2511` |
| Production `gitSha` | `81055b1387e0062301ca9c0ae7468cbf782e2511` (**matches main, not I4 RC**) |
| I4 RC | `412b7b5b94c39db4eaaebe25de91f10d6538f4e9` on `cursor/iteration4-final-release-5475` PR `#33` (contains I1⊂I2⊂I3⊂I4) |
| Production URL | https://www.goargentina.ru (apex 308 → www) |
| Production health | **DOWN** — 503; DB `dependency_unavailable`; REST **402 exceed_egress_quota**; direct PG **IPv6-only ENETUNREACH** |
| Canonical Vercel | team `go-argentina` / project `argentina-travel` / env `Production – argentina-travel` |
| Vercel new deploys | **Account is blocked** — production SHA `81055b13` still serves |
| Canonical Supabase | `uooxrypocahomoqzdvzy` |
| Repo migrations | 111 files; latest `20260819120000_final_explicit_data_api_grants` (candidate only) |
| Live journal / RLS | **NOT_PROVEN** |
| Backup / restore | Workflow failing (empty secrets); restore `not_run` |
| Paid traffic | **NO-GO** |

## Active product (CORE NOW)

Public travel portal: destinations, places, guide, KB, blog, tours, excursions, map (`/mapa-argentina`), search chrome, contacts/leads, newsletter, affiliate/partner handoff, native booking CRM, organizer cabinet, admin operations, analytics plumbing.

Public HTML shells currently return 200 from static/typed fallbacks. That is **not** a healthy data plane. `/api/tours` and `/api/excursions` return 503.

## Frozen / dormant (cost minimized)

| Module | Status | Quarantine |
|--------|--------|------------|
| Shop | DORMANT | Launch clamp + API `MODULE_QUARANTINED` (control plane) |
| Forum | DORMANT | Launch clamp + API `MODULE_QUARANTINED` (control plane) |
| Car rental / transfers | DORMANT | Modes forced `disabled` at launch; pages 404 |
| Hotels | POST_LAUNCH | No public page |
| Apartments native catalog | POST_LAUNCH | Default `request` ≠ `native_request` (intentional) |
| Own online payment | POST_LAUNCH | `productionEnabled: false` + checkout gate |
| `/api/podbor/narrative` | FROZEN | `410 API_FROZEN` |

## Agent entry (≤ few files)

1. Constitution: `docs/project-governance/GOARGENTINA_MASTER_GOAL_V6_28.07.2026.md`
2. **This file** — current facts
3. Iteration 4: `docs/project-governance/iteration4-final-release/ITERATION4_FINAL_REPORT.md`
4. Iteration 3: `docs/project-governance/iteration3-operations/ITERATION3_REPORT.md`
5. Iteration 2: `docs/project-governance/iteration2-public-product/ITERATION2_REPORT.md`
6. Iteration 1: `docs/project-governance/iteration1-production-truth/ITERATION1_REPORT.md`
7. Runbook: `docs/project-governance/RELEASE_RUNBOOK.md`
8. Module lifecycle: `docs/project-governance/module-lifecycle-registry.json` + `src/lib/modules/business-lifecycle.ts`
9. Commands: `docs/project-governance/GOLDEN_PATH.md`

## Critical journeys (live)

See `iteration4-final-release/CRITICAL_JOURNEY_MATRIX.md`.

Summary: 8 PASS (shells/auth gates), 5 FAIL, 8 BLOCKED_EXTERNAL.

Marketplace, lead persist, CMS persist, organizer persist, live RLS: not proven.

## Security / analytics

- Fail-closed rate limits on auth/booking/leads in I4 candidate.
- Live RLS: BLOCKED_EXTERNAL.
- Analytics code+consent: PASS. YM/GTM downstream: BLOCKED_EXTERNAL.
- CSP not shipped (accepted). Production headers: HSTS, XFO, nosniff, referrer, permissions.

## Golden commands

```bash
npm run dev
npm run audit:quick
npm run architecture:check
npm run release:gate
npm run production-smoke
```

## External blockers (not code)

1. Clear Supabase `exceed_egress_quota` on `uooxrypocahomoqzdvzy`.
2. Add same-ref IPv4 session pooler URL on Vercel (`*.pooler.supabase.com:5432`).
3. Unblock Vercel account for team `go-argentina`.
4. Set GitHub `production-backup` secrets + offline `age` identity; run disposable restore.
5. Then: live RLS, journal parity, persist E2E, analytics downstream, deploy I4 SHA.

## Open PRs (do not delete)

`#30` I1/S7, `#31` I2, `#32` I3, `#33` I4. I4 contains the prior lineage.
