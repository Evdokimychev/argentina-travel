# E78: SEO v3 — structured data, sitemap i18n, performance hints

## Scope

- Structured data audit script (`scripts/seo-audit.mjs`)
- Sitemap expansion with `/es/` and `/en/` for pilot i18n routes
- Product JSON-LD on tour detail, TouristTrip + Event on excursion detail
- BreadcrumbList JSON-LD on tours and excursions catalog
- `metadata.alternates.languages` (hreflang) on homepage, `/tours`, `/excursions`
- Core Web Vitals checklist and image lazy-loading notes (this document)

## Sitemap i18n

Russian URLs stay unprefixed (canonical). For paths with pilot i18n, the sitemap also lists:

- `/es/…` and `/en/…` variants

Eligible paths (`src/lib/i18n/sitemap-locales.ts`):

- `/`, `/tours`, `/excursions`
- `/blog`, `/blog/{slug}`
- `/destinations`, `/destinations/{slug}`
- `/places`, `/places/{slug}`
- `/guide/{slug}`, `/legal/{slug}`

Middleware rewrites prefixed URLs to the same route tree and sets the locale cookie (E39).

## Structured data

| Page | JSON-LD |
|------|---------|
| Homepage | WebSite + Organization (layout), WebPage |
| `/tours` | BreadcrumbList |
| `/tours/{slug}` | Product (+ Offer, AggregateRating when reviews exist) |
| `/excursions` | BreadcrumbList |
| `/excursions/{slug}` | TouristTrip + Event (when bookable) via `@graph` |
| `/blog/{slug}` | Article |

### Breadcrumbs (catalog)

`BreadcrumbListJsonLd` on catalog pages:

1. Главная → Каталог туров
2. Главная → Экскурсии

## Hreflang

`buildHreflangAlternates(path)` in `src/lib/i18n/hreflang.ts` sets:

- `ru` and `x-default` → unprefixed URL
- `es`, `en` → `/es/…`, `/en/…`

Applied on: homepage, tours catalog (via `buildCatalogMetadata`), excursions catalog.

## SEO audit script

```bash
npm run dev          # in another terminal
npm run seo-audit    # or: SEO_AUDIT_BASE_URL=https://www.goargentina.ru node scripts/seo-audit.mjs
```

Checks:

1. Static files for JSON-LD builders and i18n sitemap helper
2. `/sitemap.xml` parse and sample URL HTTP 200
3. i18n sitemap entries for `/`, `/tours`, `/excursions`
4. Title, description, canonical, hreflang on homepage, tours, excursions
5. JSON-LD types on sample tour, excursion, blog post

Report: `var/ops/seo-audit-last.json`

## Core Web Vitals checklist

Use [PageSpeed Insights](https://pagespeed.web.dev/) or Chrome DevTools → Lighthouse on:

- `/` (homepage)
- `/tours` (catalog)
- `/tours/patagonia-glaciers` (tour detail)
- `/excursions` (catalog)
- `/blog/best-time-to-visit-argentina` (article)

| Metric | Target | Project levers |
|--------|--------|----------------|
| **LCP** | ≤ 2.5 s | Hero `priority` on above-the-fold images; avoid blocking third-party scripts on LCP route |
| **INP** | ≤ 200 ms | Defer heavy client bundles; keep catalog filters responsive |
| **CLS** | ≤ 0.1 | Explicit `sizes` on `next/image`; skeleton placeholders via `SafeImage` / `ImagePlaceholder` |
| **TTFB** | ≤ 800 ms | `force-dynamic` only where needed; cache static tour slugs where possible |
| **FCP** | ≤ 1.8 s | Font subsetting, minimal critical CSS (Tailwind purge) |

### Monitoring

- `@vercel/speed-insights` in production layout
- Sentry performance (if enabled)
- Run Lighthouse in CI optionally against preview deploy

### Quick wins

- [ ] Audit hero images: WebP/AVIF, correct `sizes`, `priority` only on LCP candidate
- [ ] Preconnect to Supabase / CDN origins used on first paint
- [ ] Lazy-load below-fold map (Leaflet) and chat widgets
- [ ] Review `framer-motion` on catalog — prefer CSS for simple reveals (see E61)

## Image lazy loading audit

Next.js `<Image>` lazy-loads by default unless `priority` is set.

### Patterns in this repo

| Pattern | Lazy load | Notes |
|---------|-----------|-------|
| `next/image` without `priority` | Yes (default) | Catalog cards, similar tours, blog lists |
| `next/image` with `priority` | No | Hero, tour header gallery, collection cover, blog featured |
| `SafeImage` | Inherits from `Image` | Blur placeholder + skeleton until `onLoad` |
| External `<img>` | Manual | Avoid; grep for raw `<img` in `src/` |

### Audit command

```bash
node scripts/audit-images.mjs   # external URL inventory → docs/image-audit-report.md
```

### Recommendations

1. **LCP images** — keep `priority` on one image per route (hero or main gallery slide).
2. **Catalog grids** — no `priority`; use consistent `sizes` (e.g. `(max-width: 768px) 100vw, 33vw`).
3. **Gallery / lightbox** — load full size on interaction, not in initial HTML.
4. **Partner excursion photos** — Tripster CDN URLs; ensure `width`/`height` or `fill` + container aspect ratio to prevent CLS.
5. **Review** — re-run `audit-images.mjs` after bulk media imports.

### Files to spot-check after changes

- `src/components/TourCard.tsx`, `MarketplaceTourListCard.tsx`
- `src/components/tour-detail/TourDetailGallery.tsx`, `TourDetailHeader.tsx`
- `src/components/excursions/ExcursionCard.tsx` (if present)
- `src/components/blog/BlogCard.tsx`

## Out of scope (future)

- Per-locale slugs and hreflang on tour/excursion detail (E39.2)
- Automatic Lighthouse in CI (optional follow-up)
- `ItemList` JSON-LD on catalogs (breadcrumbs only in E78)

## Related

- [E39 i18n foundation](./i18n-e39.md)
- [Image audit report](./image-audit-report.md)
- [Motion performance notes](./motion-e61.md)
