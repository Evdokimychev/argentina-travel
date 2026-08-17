# Legacy WordPress URL redirects

Дата: 2026-08-17.

## Current behaviour (`next.config.ts`)

| Source | Destination | Notes |
|--------|-------------|-------|
| `/st_tour/:path*` | `/tours` | Catch-all catalog hub (308) |
| `/st_activity/:path*` | `/excursions` | Catch-all catalog hub (308) |

Exact `OLD → detail` redirects are **not** implementable from repository data alone: there is no WordPress CPT ID ↔ current partner slug inventory in-repo.

## Required for exact redirects

1. External crawl / GSC / Ahrefs export of indexed `/st_tour/*` and `/st_activity/*` URLs.
2. Editorial match to live `/tours/[slug]` or `/excursions/[slug]`.
3. Exact rules **above** the catch-alls in `next.config.ts` (or CMS `url_redirects` rows).

Until then, hub catch-alls are the intentional fail-closed behaviour (no redirect loops).
