# CURRENT_STATE — GoArgentina (machine + agent entry)

> **Read this first.** Historical deployment narrative lives in `PROJECT_STATE.md` below the banner / archive sections. Do not treat month-old SHAs in history as current.

| Field | Value |
|-------|--------|
| Generated | 2026-08-19 (Iteration 5) |
| Certification | **NOT CERTIFIED** — `docs/project-governance/iteration5-deep-certification/ITERATION5_FINAL_REPORT.md` |
| Launch verdict | **NO-GO** (I4, reconfirmed I5) |
| `origin/main` tip | `81055b1387e0062301ca9c0ae7468cbf782e2511` |
| Production `gitSha` | `81055b1387e0062301ca9c0ae7468cbf782e2511` (matches main; **not** I4/I5 candidates) |
| I5 candidate | `cursor/iteration5-deep-certification-5475` (contains I4 lineage + I5 hardening) |
| Production URL | https://www.goargentina.ru (apex 308 → www) |
| Production health | **DOWN** — 503; DB `dependency_unavailable`; REST **402 exceed_egress_quota**; direct PG **IPv6-only ENETUNREACH** |
| Live `/api/search` | **500 empty body** (I5 candidate fixes; not live) |
| Canonical Vercel | team `go-argentina` / project `argentina-travel` / env `Production – argentina-travel` |
| Vercel new deploys | **Account is blocked** |
| Canonical Supabase | `uooxrypocahomoqzdvzy` |
| Live journal / RLS | **NOT_PROVEN** |
| Backup / restore | Workflow failing (empty secrets); restore `not_run` |
| Paid traffic | **NO-GO** |

## Active product (CORE NOW)

Public travel portal: destinations, places, guide, KB, blog, tours, excursions, map (`/mapa-argentina`), search chrome, contacts/leads, newsletter, affiliate/partner handoff, native booking CRM, organizer cabinet, admin operations, analytics plumbing.

Public HTML shells currently return 200 from static/typed fallbacks. That is **not** a healthy data plane. `/api/tours` and `/api/excursions` return 503. Search API returns 500 on live SHA.

## Frozen / dormant (cost minimized)

Unchanged from I4: shop, forum, car rental/transfers, hotels, apartments native catalog, own online payment, `/api/podbor/narrative`.

## Agent entry (≤ few files)

1. Constitution: `docs/project-governance/GOARGENTINA_MASTER_GOAL_V6_28.07.2026.md`
2. **This file** — current facts
3. Iteration 5: `docs/project-governance/iteration5-deep-certification/ITERATION5_FINAL_REPORT.md`
4. Iteration 4: `docs/project-governance/iteration4-final-release/ITERATION4_FINAL_REPORT.md` + `FINAL_LAUNCH_DECISION.md`
5. Iterations 3–1 reports under `iteration3-operations/`, `iteration2-public-product/`, `iteration1-production-truth/`
6. Runbook: `docs/project-governance/RELEASE_RUNBOOK.md`
7. Module lifecycle: `docs/project-governance/module-lifecycle-registry.json`
8. Commands: `docs/project-governance/GOLDEN_PATH.md`

## External blockers (not code)

1. Clear Supabase `exceed_egress_quota` on `uooxrypocahomoqzdvzy`.
2. Add same-ref IPv4 session pooler URL on Vercel (`*.pooler.supabase.com:5432`).
3. Unblock Vercel account for team `go-argentina`.
4. Set GitHub `production-backup` secrets + offline `age` identity; run disposable restore.
5. Then: live RLS, journal parity, persist E2E, deploy I5 SHA, re-run production smoke (search must not 500).

## Open PRs (do not delete)

`#30` I1/S7, `#31` I2, `#32` I3, `#33` I4, plus I5 PR on this branch.
