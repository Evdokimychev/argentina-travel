# CURRENT_STATE — GoArgentina (machine + agent entry)

> **Read this first.** Historical deployment narrative lives in `PROJECT_STATE.md` below the banner / archive sections. Do not treat month-old SHAs in history as current.

| Field | Value |
|-------|--------|
| Generated | 2026-08-18 (Sprint 7) |
| `origin/main` tip | `81055b1387e0062301ca9c0ae7468cbf782e2511` (pre–Sprint 7 merge tip; update after merge) |
| Sprint ancestry | S1…S3 → `#27` S4 → `#28` S5 → `#29` S6 on main |
| Production URL | https://www.goargentina.ru |
| Production `gitSha` (probed) | `81055b13…` (matches main tip when last probed) |
| Production health | **DOWN** — `database` + `postgresDirect` `dependency_unavailable` (`uooxrypocahomoqzdvzy`) |
| Vercel | Team `go-argentina` / project `argentina-travel`; intermittent **Account is blocked** on some statuses |
| Paid traffic / product release | **NO-GO** until live analytics + healthy data plane (Sprint 5 honesty) |

## Active product (CORE NOW)

Public travel portal: destinations, places, guide, KB, blog, tours, excursions, map (`/mapa-argentina`), search chrome, contacts/leads, newsletter, affiliate/partner handoff, native booking CRM, organizer cabinet, admin operations, analytics plumbing.

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
3. Module lifecycle: `docs/project-governance/module-lifecycle-registry.json` + `src/lib/modules/business-lifecycle.ts`
4. Commands: `docs/project-governance/GOLDEN_PATH.md`
5. Architecture: `docs/ai-first/ARCHITECTURE.md` + `npm run architecture:check`
6. Domain docs: `docs/integrations/*`, `.cursor/rules/*`

## Golden commands

```bash
npm run dev
npm run audit:quick
npm run release:gate
npm run production-smoke
```

## External blockers (not code)

1. Restore Direct Postgres for `uooxrypocahomoqzdvzy`
2. Stable Vercel deploy path for main (account block intermittent)
3. Live RLS / migration parity / restore rehearsal evidence

## Sprint 7 branch

`cursor/sprint7-architecture-simplify-5475` — complexity reduction without weakening Sprint 1–6 gates.
