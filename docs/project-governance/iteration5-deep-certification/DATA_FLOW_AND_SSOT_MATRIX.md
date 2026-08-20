# Data Flow and SSOT Matrix — Iteration 5

Evidence date: 2026-08-19. Live Data API: **402 / unavailable**. Flows below are **source contracts**, not live traces.

## Tripster / excursions

Tripster fetch → normalize (`src/lib/tripster/*`) → `tripster_*` tables / PG fallback → `fetchExcursionsResultServer` → catalog page / detail / search filter.

SSOT for a public excursion card: partner listing after quality filters, then native platform listings. Search index is **not** SSOT: it can outlive the catalogue.

I5 change: search filters commercial hits only after a successful catalogue read. Unavailable ≠ confirmed empty.

## Marketplace tours

Partner + platform listings → `fetchMarketplaceTours` (deadline + last-known-good) → `/tours`, home, embeds.

SSOT for price/date: listing fields after `offer-quality` / public display filters (I2). Cards must not invent a substitute date.

Live `/api/tours`: 503 `Tours API unavailable` on SHA `81055b13`.

## CMS / editorial

Editor → `cms_*` RPCs with `expectedVersion` CAS → `revalidateTag` / `revalidatePath` (I3) → public resolver.

Cutover flags (`cmsBlogCutover`, `cmsGuideCutover`, `cmsDestinationCutover`, `cmsPlaceCutover`) default **false**. User still sees static/reviewed overlay when CMS path is not cut over.

## Booking request

Public form / checkout → `/api/bookings` (rate-limited, fail-closed) → atomic RPC → CRM + organizer inbox.

SSOT for booking status: `bookings` row + transition matrix. UI localStorage is fallback only when remote mode is off.

## Organizer

Owned slugs from `tours.owner_user_id` (I3) → organizer APIs. I5: remote fetch failure must not render as «нет заявок».

## Search

`executeSiteSearch` (Meilisearch / Postgres / static) → control-plane nav filter → catalogue availability filter → chrome dialog.

Live `/api/search?q=iguazu`: **HTTP 500, empty body** on production SHA. Chrome (`SiteSearch`) then silently uses the static index. I5 candidate: 200 with `catalog.tours|excursions: unavailable` and a visible notice.

## Places / map

Editorial place seed + CMS places (cutover false) → `/places`, `/mapa-argentina`.

Live `/api/map/objects`: 200, 192 objects (editorial geography). This is an intended static/editorial SSOT, not a false-empty marketplace.

## Newsletter / contact

`/api/contact`, `/api/newsletter` → lead capture → `contact_submissions` / subscribers.

Adversarial live: malformed JSON → 400 `Некорректный JSON.` (no stack). Empty newsletter → 400 `Укажите email.`

## Price / date / image lineage (user-visible)

| Value | Authoritative source | Forbidden fallback |
|-------|----------------------|--------------------|
| Tour price | Current listing after quality filters | Invented currency or 0 as «free» |
| Tour dates | Future-or-today in `America/Argentina/Buenos_Aires` | First `availableDates[0]` if past |
| Hero image | Entity media; partner image if quality-ok | Unrelated destination stock |
| Place description | Editorial place / CMS place | Marketplace annotation |
| Organizer name | Profile / owned tour owner | Seed catalog slug match (removed I3) |
| Availability | Slot table / partner schedule | Silent empty = sold out |
