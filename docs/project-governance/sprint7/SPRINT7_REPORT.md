# Sprint 7 — Architecture simplification report

## Decision

**GO TO SPRINT 8 — ARCHITECTURE CONVERGED** (code/governance), with **external live blockers** unchanged (Direct Postgres + intermittent Vercel account block).

Live production acceptance and Sprint 6 live RLS/restore evidence remain **BLOCKED_EXTERNAL** — distinct from unfinished architecture work.

## Before → after complexity

See `COMPLEXITY_DELTA.json`. Page/handler counts kept stable on purpose (no catch-all gaming). Meaningful reductions: dormant API quarantine aligned to launch clamp, own-payment runtime kill-switch, frozen orphan podbor narrative API, agent/governance SSOT, CI wall-clock parallelization, flag destiny, golden path, dead npm aliases removed (−4).

## Module actions

| Module | Before | After | Action | Reason |
|--------|--------|-------|--------|--------|
| Portal / tours / excursions / guide / KB / blog / map / booking / organizer | CORE | CORE | KEEP | Shipping product |
| Shop / forum | hidden but API could bypass launch clamp | DORMANT + control-plane quarantine | FROZEN | Pages + APIs fail closed together |
| Car rental / transfers | launch-disabled | DORMANT | FROZEN | Already policy-gated |
| Hotels / apartments-native | post-launch | POST_LAUNCH | FROZEN | No public hotels; apartments `request` ≠ `native_request` |
| Own payment | deferred but checkout APIs open | POST_LAUNCH + gate | FROZEN | Preserve webhooks; block new checkout |
| Podbor quiz / tour-match / guide assistant | experimental overlap | EXPERIMENTAL lanes kept | KEEP | Distinct engines; not one AI blob |
| `/api/podbor/narrative` | unused duplicate | FROZEN 410 | ARCHIVED (API) | Client narrative is canonical |
| `/api/quick-explore` | grouped with AI | SUPPORTING map BFF | KEEP | Not AI |
| `/map` | legacy redirect | LEGACY | KEEP | SEO-safe → `/mapa-argentina` |

## Routes / API

- Canonical map: `/mapa-argentina`; `/map` remains redirect.
- Forum/shop public APIs: `404 MODULE_QUARANTINED` via **launch-guarded** control plane (fail closed if settings down).
- Own payment: `create_payment_link` + Stripe/MP sessions → `503 PAYMENT_UNAVAILABLE` when `productionEnabled: false`.
- `/api/podbor/narrative` → `410 API_FROZEN`.
- Prisma remains niche places adapter; Supabase authoritative.

## CMS / flags

- Cutover flags remain `false` by default with explicit removal destiny (`content-runtime-ownership.ts` + `FLAG_DESTINY.json`).
- Steady state documented: typed/file + CMS overlay until cutover proven, then CMS + typed fallback.
- Apartments mode semantics documented on `ApartmentsModuleMode`.

## CI / tooling

- `verify-contracts` ∥ `verify-release` (same evidence groups as former monolithic `release:gate`).
- Playwright browser cache on release job.
- `architecture:check` in static gate.
- Removed aliases: `content:crawl`, `content:fix`, `sync:instagram-feed`, `sync:instagram-feed:dry`.
- Golden path: `docs/project-governance/GOLDEN_PATH.md`.

## External blockers

1. Direct Postgres `uooxrypocahomoqzdvzy` unavailable (`dependency_unavailable`)
2. Vercel account block intermittent on some statuses
3. Live RLS / restore / migration parity evidence

## Синхронизация проекта

- Current facts: `CURRENT_STATE.md`
- Lifecycle: `business-lifecycle.ts` + `module-lifecycle-registry.json`
- Flags: `FLAG_DESTINY.json` + `content-runtime-ownership.ts`
- Commands: `GOLDEN_PATH.md` / `COMMAND_REGISTRY.json`
- Architecture: `docs/ai-first/ARCHITECTURE.md`
