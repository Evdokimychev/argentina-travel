# Sprint 7 — Module classification draft (BEFORE)

**SHA:** `81055b1387e0062301ca9c0ae7468cbf782e2511`  
**Branch:** `cursor/sprint7-architecture-simplify-5475`  
**Measured:** 2026-08-18  
**Nature:** factual draft from routes, defaults, and flags — not a product-scope decision.

Status vocabulary:

| Status | Meaning in this draft |
|--------|------------------------|
| CORE | Primary tourist / commercial path with active routes + default nav/modules on |
| SUPPORTING | Needed for CORE journeys (auth, search chrome, contacts, analytics plumbing) |
| EXPERIMENTAL | Built surface exists; AI/personalization or parallel UX not required for launch scoring |
| POST_LAUNCH | Explicitly planned / mode=`planned` / payment not production-enabled |
| DORMANT | Code + routes exist but launch guards / defaults keep it unpublished or disabled |
| LEGACY | Redirect-only or superseded naming kept for URL continuity |

---

## Classification table

| Module | Status guess | Evidence (paths / flags) |
|--------|--------------|--------------------------|
| **portal** (home + chrome) | CORE | `src/app/page.tsx`; `src/app/layout.tsx` + `SiteChrome`; public modules geography/about activated by default |
| **destinations** | CORE | `src/app/destinations/**` (2 pages); nav `showDestinations: true`; `publicModules.destinations` activated/published |
| **places** | CORE | `src/app/places/**`; nav `showPlaces: true`; optional Prisma via `PLACES_USE_DB` in `src/lib/places-repository.ts` |
| **guide** | CORE | `src/app/guide/**` (3 pages); nav `showGuide: true`; CMS cutover default `cmsGuideCutover: false` |
| **KB** (`baza-znaniy`) | CORE | `src/app/baza-znaniy/**` (6 pages); nav `showKnowledgeBase: true` |
| **blog** / journal | CORE | `src/app/blog/**` (6 pages); nav `showJournal: true`; `cmsBlogCutover: false` default |
| **tours** | CORE | `src/app/tours/**` + `src/app/api/tours/**`; nav `showTours: true`; commercial modes `partner_redirect` + `own_booking` enabled |
| **excursions** | CORE | `src/app/excursions/**` + `src/app/api/excursions/**`; nav `showExcursions: true` |
| **marketplace** | CORE | No `/marketplace` page; catalog lives under tours/excursions + `src/components/marketplace/**` + admin marketplace views |
| **map** | CORE (canonical) / LEGACY (`/map`) | Canonical: `src/app/mapa-argentina/page.tsx`. Legacy: `src/app/map/page.tsx` + `next.config.ts` 301 → `/mapa-argentina` |
| **search** | SUPPORTING | No public `/search` page; header `showSiteSearch: true` → `SiteSearch` + `src/app/api/search/route.ts` |
| **contacts** | SUPPORTING | `src/app/contacts/page.tsx`; forms `contactEnabled: true`; API `src/app/api/contact`; legacy `/contact` redirect |
| **newsletter** | SUPPORTING | `showFooterNewsletter: true`; `newsletterEnabled: true`; `src/app/api/newsletter` |
| **analytics** | SUPPORTING | `src/app/api/analytics`; admin analytics pages; readiness roles always include `analytics` |
| **admin** | SUPPORTING | `src/app/admin/**` (51 pages); `src/app/api/admin/**` (112 handlers) |
| **organizer** (cabinet) | CORE | `src/app/organizer/**` (20 pages); `src/app/api/organizer/**` (35); join via `/join` |
| **organizers** (public profiles) | SUPPORTING | `src/app/organizers/[slug]/page.tsx` — public profile, not the cabinet |
| **booking** | CORE | `src/app/booking/**` (4); `src/app/api/bookings/**` (14); `own_booking` productionEnabled |
| **affiliate** | CORE | `affiliate` mode enabled; `src/app/api/affiliate/**` (6); Travelpayouts/partner handoff |
| **shop** | DORMANT | Routes `src/app/shop/**` + API; defaults `activated/published: false`; launch guards force nav/search/sitemap off |
| **forum** | DORMANT | `src/app/forum/**` + API; defaults unpublished; launch guards off; page also gates on `isSupabaseForumEnabled()` |
| **apartments** | POST_LAUNCH / partial SUPPORTING | Mode default `request` (services hub request card). Native catalog `/apartments` requires `apartmentsMode === "native_request"` (`src/app/apartments/page.tsx`) — not default |
| **car-rental** | DORMANT (public launch) | Page `src/app/car-rental/page.tsx` exists; default + launch guard `carRentalMode: "disabled"`; API 503 when disabled |
| **transfers** | DORMANT (public launch) | Page `src/app/transfers/page.tsx`; default + launch guard `transfersMode: "disabled"` |
| **hotels** | POST_LAUNCH | `hotelsMode: "planned"`; **no** `src/app/hotels` route found; admin travel-modules preview only |
| **audio** (`audio-guides`) | SUPPORTING / affiliate | `src/app/audio-guides/**` + API; partner WeGoTrip surface via services hub (not launch-guarded like shop/forum) |
| **AI / assistant / recommendations / podbor** | EXPERIMENTAL | `/podbor` page; APIs `src/app/api/ai/tour-match`, `assistant/ask`, `recommendations`, `podbor/narrative` — assistants not in commercial readiness roles |
| **conversations** | SUPPORTING | `src/app/api/conversations/**` (5) + organizer/profile messaging; gated by Supabase auth messaging helpers |
| **group trips** | EXPERIMENTAL | Organizer + profile pages; `src/app/api/group-trips/**` — not a default public nav module |
| **own payments** | POST_LAUNCH | `own_payment.productionEnabled: false`; payment admin/organizer UI + `src/app/api/payments/sandbox-mode` exist as infrastructure |
| **experiments / feature flags** | SUPPORTING (ops) | `src/app/api/feature-flags`, admin feature-flags; `DARK_THEME_ENABLED = false` in `src/types/theme.ts` — theme experiment off |
| **immigration** | DORMANT-in-nav / editorial reachable | Pages exist; default `showImmigration: false`; published for direct URL; launch guard keeps nav off |
| **gallery** | SUPPORTING | `src/app/gallery`; nav `showGallery: true` |
| **services hub** | SUPPORTING | `src/app/services` aggregates flights/insurance/esim/etc.; filters by module modes |
| **flights / insurance / esim** | SUPPORTING (affiliate/partner) | Dedicated pages under `src/app/{flights,insurance,esim}`; partner/teaser pattern |
| **trip** vs **trip-prep** | SUPPORTING (distinct) | Token portal vs checklist — not duplicates (see overlaps) |
| **dev / embed / landing / maintenance** | LEGACY or ops | `src/app/dev`, `embed`, `landing`, `maintenance` — non-core surfaces |

---

## Top dormant / simplify candidates (with evidence)

1. **Shop** — unpublished by default + hard launch clamp (`public-launch-guards.ts`); still carries pages, API, captcha, admin commerce settings.  
2. **Forum** — same launch clamp + auth gate; 3 pages + 5 API routes.  
3. **Car-rental & transfers** — full public pages remain while modes forced `disabled` at launch; native mobility APIs return 503 when disabled.  
4. **Hotels** — `planned` only; no App Router page; pure future vertical.  
5. **Legacy `/map`** — redirect page + next.config redirect duplicate the canonical `/mapa-argentina`.  
6. **Apartments native catalog** — `/apartments` dead under default `request` mode; only services “request” path is intended until `native_request`.  
7. **Own online payment** — business model explicitly disables production scoring/roles for payments while Stripe/MP/sandbox code remains.  
8. **Immigration in nav** — content kept, discovery surfaces intentionally off.

---

## CMS cutover flag values (code defaults)

From `DEFAULT_SITE_FEATURES` in `src/lib/cms/site-globals/normalize.ts`:

| Flag | Default |
|------|---------|
| `cmsBlogCutover` | `false` |
| `cmsGuideCutover` | `false` |
| `cmsDestinationCutover` | `false` |
| `cmsPlaceCutover` | `false` |

Live DB `site.features` may override; admin enablement is readiness-gated in `src/app/api/admin/settings/route.ts`.

---

## Prisma vs Supabase

- **Supabase primary:** architecture-current static signals **358** supabase vs **12** prisma; broad usage across bookings, auth, CMS, organizer, privacy, analytics.  
- **Prisma niche:** `prisma/schema.prisma` models places; runtime only via `src/lib/prisma.ts` → `places-repository.ts` when `PLACES_USE_DB=true` and attested `DATABASE_URL`.  
- **Conclusion:** do not treat Prisma as a second primary DB for Sprint 7 simplification; treat it as optional places adapter on top of the attested Postgres/Supabase target.

---

## Route overlaps (naming)

| Pair | Verdict |
|------|---------|
| `/map` vs `/mapa-argentina` | Legacy → canonical redirect |
| `/organizer` vs `/organizers` | Cabinet vs public profile (keep both names but document) |
| `/trip/[token]` vs `/trip-prep` | Client portal vs prep checklist |
| `/contact` vs `/contacts` | Legacy redirect |
| `/migration*` vs `/immigration` | Legacy redirects |

---

## Commercial / readiness context

- Enabled modes: `own_lead`, `partner_redirect`, `affiliate`, `own_booking`.  
- Disabled: `own_payment`.  
- Tooling: `npm run readiness:90`, `npm run promotion:gate` (technical vs commercial vs paid-traffic separation).  
- Historical surface snapshot `var/ops/product-audit-after.json` (2026-07-15: 133 pages / 235 API) is stale vs current AST inventory (159 / 312).

---

## Metrics cross-check

See `BEFORE_METRICS.json` for machine-readable counts. Key BEFORE numbers:

- Pages **159** · API `route.ts` **307** · inventory handlers **312** · app domains **46** · API domains **55**  
- HTTP: GET **211** / POST **139** / PATCH **39** / DELETE **19** / PUT **8** / OPTIONS **5** / HEAD **1**  
- `"use client"` **779** · npm scripts **177** · deps **41** · devDeps **20**
