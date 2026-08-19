# CURRENT_STATE — GoArgentina (machine + agent entry)

> **Read this first.** Historical deployment narrative lives in `PROJECT_STATE.md` below the banner / archive sections. Do not treat month-old SHAs in history as current.

| Field | Value |
|-------|--------|
| Generated | 2026-08-19 (Iteration 2) |
| `origin/main` tip | `81055b1387e0062301ca9c0ae7468cbf782e2511` |
| Sprint ancestry | S1…S6 on main; Sprint 7 in PR `#30`; Iteration 2 public hardening on `cursor/iteration2-public-product-5475` |
| Production URL | https://www.goargentina.ru (apex 308 → www) |
| Production `gitSha` | `81055b1387e0062301ca9c0ae7468cbf782e2511` (**matches main**) |
| Production health | **DOWN** — REST **402 exceed_egress_quota**; direct PG **IPv6-only ENETUNREACH** |
| Canonical Vercel | team `go-argentina` / project `argentina-travel` / env `Production – argentina-travel` |
| Vercel new deploys (2026-08-19) | **Account is blocked** on latest PR preview status — production SHA `81055b13` still serves |
| Canonical Supabase | `uooxrypocahomoqzdvzy` (config.toml + production public JWT `ref` + health) |
| Paid traffic / product release | **NO-GO** |

## Active product (CORE NOW)

Public travel portal: destinations, places, guide, KB, blog, tours, excursions, map (`/mapa-argentina`), search chrome, contacts/leads, newsletter, affiliate/partner handoff, native booking CRM, organizer cabinet, admin operations, analytics plumbing.

Public HTML shells currently return 200 from static/typed fallbacks. That is **not** a healthy data plane.

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
3. Iteration 2 report: `docs/project-governance/iteration2-public-product/ITERATION2_REPORT.md`
4. Iteration 1 report: `docs/project-governance/iteration1-production-truth/ITERATION1_REPORT.md`
5. Module lifecycle: `docs/project-governance/module-lifecycle-registry.json` + `src/lib/modules/business-lifecycle.ts`
6. Commands: `docs/project-governance/GOLDEN_PATH.md`
7. Architecture: `docs/ai-first/ARCHITECTURE.md` + `npm run architecture:check`

## Golden commands

```bash
npm run dev
npm run audit:quick
npm run architecture:check
npm run release:gate
npm run production-smoke
```

## External blockers (not code)

1. Clear Supabase `exceed_egress_quota` on `uooxrypocahomoqzdvzy` (plan / spend cap).
2. Add same-ref IPv4 session pooler URL on Vercel (`*.pooler.supabase.com:5432`). Direct `db.<ref>.supabase.co` has no A record.
3. Unblock Vercel account for team `go-argentina` so new production/preview deploys can land (status currently “Account is blocked”).
4. Then: live RLS, migration journal parity, backup + disposable restore.
