# Sprint 7 — Flags & commands inventory (draft)

Measurement only. Source tree: `src/`, `scripts/`, `package.json`, `.env.example`. Date: 2026-08-18.

---

## 1. Feature flags inventory

### 1.1 Env / process flags (ENABLE*, commerce, launch)

| Flag | Role | Class |
|------|------|--------|
| `NEXT_PUBLIC_ENABLE_DEMO_SEED` | Demo seed / demo data path (`src/lib/demo-mode.ts`). Forbidden `true` in production readiness / release-gate / build validation. | **Permanent** control (must stay `false` in prod) |
| `NEXT_PUBLIC_STRIPE_ENABLED` / `STRIPE_ENABLED` | Explicit Stripe on/off; default may follow key presence (`src/lib/payments/stripe-client.ts`, `payment-providers-client.ts`). | Permanent |
| `PAYMENT_SANDBOX_MODE` | Forbidden `true` before production cutover (`scripts/production-readiness.mjs`). | Permanent (ops) |
| `MERCADOPAGO_REFUNDS_ENABLED` | Admin refund path via MP API. | Permanent |
| `TRAVELPAYOUTS_LINKS_ROUTE_ENABLED` | Partner links route gate (default false in `.env.example`). | Permanent / low-traffic |
| `STAGING_ACCEPTANCE_ENABLED` | Staging acceptance harness. | Diagnostic / non-prod |
| `PUBLIC_LAUNCH_SHOW_UNFINISHED` | When `=1`, bypasses public launch clamp (`src/lib/cms/site-globals/public-launch-guards.ts`). | **Migration / preview** override |
| `NEXT_PUBLIC_APP_MODE` | `production` vs `demo` (`src/lib/runtime-mode.ts`, `build:demo`). | Permanent |
| `NEXT_PUBLIC_SUPABASE_AUTH` | Auth on unless `"false"`. | Permanent |
| `NEXT_PUBLIC_TOURS_SOURCE` | `supabase` \| `hybrid`. | Permanent |
| `NEXT_PUBLIC_SUPABASE_TOURS` | Tours from Supabase unless `"false"`. | Permanent |
| `NEXT_PUBLIC_PARTNER_IMAGE_PROXY` | Partner image proxy (`=== "true"`). | Permanent |
| `NEXT_PUBLIC_DISABLE_NEXT_IMAGE_OPTIMIZATION` | Next image opt-out (`next.config.ts`). | Permanent / ops |

**Not found:** dedicated `FEATURE_*` env vars. The only `FEATURE_KEYS` hit is Intui transfer feature mapping in `src/lib/intui/mapper.ts` (partner payload fields, not product flags).

### 1.2 DB feature flags (`feature_flags` table)

- Runtime: `src/lib/feature-flags/server.ts` (`getFlag` / rollout bucket), public `GET /api/feature-flags`, admin CRUD `/api/admin/feature-flags`.
- **Known product key in code:** `homepage_recommendations_v2` — read on homepage (`src/app/page.tsx`); suggested in admin UI (`FeatureFlagsView.tsx`).
- Missing / failed DB → flag evaluates **false** (fail-closed).
- Class: **Permanent** platform; keys beyond homepage are admin-created → review for **dead candidates** if unused in `src/`.

### 1.3 CMS / site module flags

**`site.features`** (`SiteFeaturesGlobal`, CMS registry + `normalize.ts`):

| Field | Semantics | Class |
|-------|-----------|--------|
| `maintenanceMode` | Site maintenance | Permanent |
| `allowOrganizerSignup` | Organizer applications | Permanent |
| `cmsBlogCutover` | Blog CMS-only (no TS fallback) | **Migration** cutover |
| `cmsGuideCutover` | Guide CMS-only | Migration cutover |
| `cmsDestinationCutover` | Destinations CMS-only | Migration cutover |
| `cmsPlaceCutover` | Places CMS-only | Migration cutover |

Cutover helpers: `src/lib/cms/cms-cutover.ts`, scripts `cms:readiness` / `cms:cutover-enable`, admin panel `CmsCutoverPanel.tsx`.

**`site.modules`** travel modes + `publicModules.*` lifecycle (`activated` / `published` / search / sitemap):

| Mode field | Values | Notes |
|------------|--------|--------|
| `apartmentsMode` | `disabled` \| `request` \| `preparing_native` \| `native_request` | See §5 |
| `carRentalMode` | `disabled` \| `partner` \| `preparing_hybrid` | Launch guard forces `disabled` |
| `transfersMode` | `disabled` \| `request` \| `partner` \| `preparing_hybrid` | Launch guard forces `disabled` |
| `hotelsMode` | `disabled` \| `planned` | Not a live product |
| `show*InServices` | booleans | Hub cards only |

**`site.navigation`** `showForum` / `showShop` / … — menu intent, separate from route publish state (`types/site-globals.ts` comment).

### 1.4 Launch guards

`applyPublicLaunchGuards` (`public-launch-guards.ts`), applied on public control-plane reads (`site-settings-edge.ts`):

Unless `PUBLIC_LAUNCH_SHOW_UNFINISHED=1`:

- Nav: `showShop`, `showForum`, `showImmigration` → false
- Travel: `carRentalMode` / `transfersMode` → `disabled`; hide from services
- Modules: **shop** & **forum** → `activated/published/search/sitemap` false
- **immigration** stays activated/published for direct URL; hidden from nav/search

Middleware (`src/middleware.ts`) 404-rewrites when `isPublicPathEnabled` or `isTravelModulePathEnabled` fails → unfinished surfaces stay off public nav **and** direct URL (except immigration content path).

Class: **Migration / launch clamp** until inventory ready; override is intentional preview only.

### 1.5 Permanent vs migration vs dead candidates

| Class | Items |
|-------|--------|
| **Permanent** | Demo-seed forbid, Stripe/MP gates, app/auth/tours mode, DB `feature_flags` platform, maintenance / organizer signup, module modes for live verticals |
| **Migration** | Four CMS cutover lanes + `cms:cutover-*` scripts; `PUBLIC_LAUNCH_SHOW_UNFINISHED`; launch clamps on shop/forum/car/transfers |
| **Dead / review candidates** | Extra `feature_flags` rows not referenced in code (only `homepage_recommendations_v2` is hardcoded); `hotelsMode=planned` (no public route); Intui `FEATURE_KEYS` (not product flags); duplicate npm aliases under LEGACY (see §2) |

---

## 2. npm scripts inventory

**Count:** 177 scripts in `package.json`.

### 2.1 Grouping (best effort)

| Group | ~Count | Examples |
|-------|--------|----------|
| **GOLDEN_PATH** | 9 | `dev`, `dev:clean`, `build`, `start`, `preview:production`, `lint`, `test`, `audit`, `audit:quick` |
| **CI** | 22 | `release:gate`, `quality:*`, `test:e2e:smoke`, `test:e2e:a11y`, `inventory:check`, `publish:verify*`, `audit:deps:*`, `test:partner-regression` |
| **RELEASE** | 7 | `production-smoke`, `production-readiness`, `promotion:gate`, `release:public-production`, `readiness:90*` |
| **DIAGNOSTIC** | ~74 | `supabase:verify`, `rls-audit`, `security:*`, `seo-audit`, `*readiness*`, `content:*`, `lighthouse:*`, `marketplace:quality*`, editorial audits |
| **MIGRATION** | 11 | `supabase:migrate`, `supabase:baseline:*`, `cms:cutover-enable`, `db:migrate`/`db:push`, `kb:migrate-collector*`, `media:migrate-reg-ru`, `security:migration-parity` |
| **ONE_OFF** | ~49 | partner syncs, seeds, KB integrate, media generate/import, map geodata builds, prune/bootstrap |
| **LEGACY** | 5 | `build:demo`, `test:e2e:stage2-visual`, `test:e2e:ux-audit`, `lighthouse:blog`, `content:crawl` |

CI wiring detail: `CI_BASELINE_NOTES.md`.

### 2.2 Obvious aliases (same underlying script)

**Exact same command string:**

- `prebuild` = `runtime-text:audit` → `scripts/runtime-text-audit.mjs`
- `postinstall` = `db:generate` → `prisma generate`
- `content:crawl` = `content:audit` = `content:fix` → `scripts/content-audit.mjs`
- `sync:instagram-feed` = `media:import-instagram` (+ `:dry` pair)

**Same file, different flags / wrappers:**

- `release:gate` ↔ `quality:{static,contracts,content,security,commerce,journeys,production}` → `scripts/release-gate.mjs`
- `audit` / `audit:quick` / `audit:security` / `audit:perf` → `scripts/audit.mjs`
- `publish:verify` / `:full` / `:pre-deploy` → `scripts/publish-turnkey.mjs`
- `content:lint` → `content-audit.mjs --strict` (sibling of crawl/audit/fix)
- Many `:check` / `:strict` / `:prod` / `:dry` variants share one implementation (content, KB, media, editorial, baselines, etc.)

---

## 3. Dormant modules (hidden nav, live attack surface)

Launch clamps hide **forum**, **shop**, **car-rental** (and transfers) from public nav; middleware 404s unpublished / disabled travel paths. Code + mutations remain.

| Module | Public UI | Mutations / APIs | Cron / webhooks |
|--------|-----------|------------------|-----------------|
| **Forum** | `/forum/**` pages; gated by middleware + `isSupabaseForumEnabled()` (auth proxy). POST: create thread/post, report. | `src/app/api/forum/**` (GET+POST); admin `src/app/api/admin/forum/**` | **No** dedicated cron/webhook |
| **Shop** | `/shop`, `/shop/[slug]`; `isPublicPathEnabled` → 404 when unpublished. | POST `src/app/api/shop/orders` (create); GET order(s); admin catalog/orders CRUD | **No** |
| **Car rental** | `/car-rental`; launch → `carRentalMode=disabled` → middleware travel gate 404. Partner LocalRent UI still in tree. | No `/api/car-rental/*`; mobility policy + affiliate elsewhere | **No** |
| **Apartments** | Catalog `/apartments/**` only if `native_request`. `request` mode = services → contacts form only. | Public POST inquiries; organizer + admin apartment/inquiry APIs | **No** |

**Cron inventory (unrelated to these modules):** 19 handlers under `src/app/api/cron/` (partners, bookings, CMS, messaging, privacy, ops…). **Vercel scheduled** (`vercel.json`): only `affiliate-sync`, `platform-maintenance`, `seo-search-sync`, `content-factory-publish`. Remaining cron routes are invoke-on-demand / secret-gated.

**Webhooks:** `src/app/api/webhooks/{payments/*,youtravel/booking,meta/*}` — not forum/shop/car/apartments.

**Risk for Sprint 7:** dormant modules keep write endpoints; visibility flags ≠ code deletion. Prefer keep fail-closed guards; candidate for later quarantine is unused admin catalog if product decides modules stay off.

---

## 4. apartmentsMode: `request` vs `native_request`

Types: `ApartmentsModuleMode` in `src/types/site-globals.ts`. Default in normalize: `"request"`; safe edge/server fallbacks often `"disabled"`.

### `native_request` — own catalog + confirmation inquiry

| Layer | Path |
|-------|------|
| Visibility | `isTravelModulePathEnabled("/apartments")` true only for this mode (`public-module-visibility.ts`) |
| Policy | `evaluatePublicModuleAccess(..., "apartments")` allows public_read/write only if `native_request` (`public-module-policy-server.ts`) |
| Pages | `/apartments`, `/apartments/[slug]` call `notFound()` unless mode matches (`app/apartments/**`) |
| API | `POST /api/apartments/[slug]/inquiries` → `enforcePublicModuleAccess("apartments","public_write")` → RPC `apartment_create_inquiry`; status `awaiting_confirmation` |
| Services hub | `NATIVE_APARTMENTS_CATEGORY` → href `/apartments` (`services-hub.ts`) |
| Organizer/admin | Draft/submit/availability/moderate + inquiry ops under `/api/organizer/apartments/**`, `/api/admin/apartments/**` |
| Analytics | `booking_mode: "native_request"` (`gtm-events.ts`, event contracts) |
| Module registry | `published: true` only in this mode (`modules/registry.ts`) |

### `request` — manager matching, no public catalog

| Layer | Path |
|-------|------|
| `/apartments` | **404** (page + middleware travel gate) |
| Public write policy | **Blocked** (not `native_request`) |
| Services hub | If not `disabled` and `showApartmentsInServices`: `OPTIONAL_SERVICE_CATEGORIES[0]` → `/contacts?service=apartment-rental` |
| Organizer inventory | Preview copy: native inventory **not** published (`TravelModulesPreview.tsx`) |
| Registry | `configured: true`, `published: false`; reason string about подбор по заявке |

### Sibling modes

- `disabled` — no services card; paths off.
- `preparing_native` — treated like non-native for public catalog (same as `request` for `/apartments` gate); staging product strategy.

---

## 5. Pointers

- CI nesting / fast PR: `docs/project-governance/sprint7/CI_BASELINE_NOTES.md`
- Before metrics: `docs/project-governance/sprint7/BEFORE_METRICS.json`
