# E78: SEO v4 — structured data, indexability and full sitemap crawl

## Scope

- Full-site SEO audit script (`scripts/seo-audit.mjs`)
- Publication-aware sitemap: only indexable canonical URLs
- Product JSON-LD on tour detail, TouristTrip + Event on excursion detail
- BreadcrumbList JSON-LD on tours and excursions catalog
- `metadata.alternates.languages` (hreflang) on homepage, `/tours`, `/excursions`
- Core Web Vitals checklist and image lazy-loading notes (this document)

## Sitemap and locales

Russian URLs stay unprefixed and canonical. Locale fallback pages are `noindex` and are not
added to the sitemap. `/es/…` and `/en/…` may be added only after the CMS has an explicit
publication-aware locale registry and the page contains a complete translation.

Potentially localizable paths (`src/lib/i18n/sitemap-locales.ts`):

- `/`, `/tours`, `/excursions`
- `/blog`, `/blog/{slug}`
- `/destinations`, `/destinations/{slug}`
- `/places`, `/places/{slug}`
- `/guide/{slug}`, `/legal/{slug}`

Middleware rewrites prefixed URLs to the same route tree and sets the locale cookie (E39),
but a rewrite alone does not make a fallback URL eligible for indexing.

## Structured data

| Page | JSON-LD |
|------|---------|
| Homepage | WebSite + Organization (layout), WebPage |
| `/tours` | BreadcrumbList |
| `/tours/{slug}` | Product (+ Offer, AggregateRating when reviews exist) |
| `/excursions` | BreadcrumbList |
| `/excursions/{slug}` | TouristTrip; Event only for a concrete dated slot with a real place |
| `/blog/{slug}` | Article |

### Breadcrumbs (catalog)

`BreadcrumbListJsonLd` on catalog pages:

1. Главная → Каталог туров
2. Главная → Экскурсии

## Hreflang

`buildHreflangAlternates(path)` in `src/lib/i18n/hreflang.ts` can set:

- `ru` and `x-default` → unprefixed URL
- `es`, `en` → `/es/…`, `/en/…`

Hreflang must be emitted only between published, indexable equivalents. The audit treats a
link to a `noindex` fallback or a missing reciprocal link as a critical error.

## SEO audit script

```bash
npm run dev          # in another terminal
npm run seo-audit    # or: SEO_AUDIT_BASE_URL=https://www.goargentina.ru node scripts/seo-audit.mjs
```

For a faster diagnostic run, set `SEO_AUDIT_MAX_URLS=50`. The release check intentionally
leaves the limit unset and crawls every URL. `SEO_AUDIT_CONCURRENCY` defaults to `8`.
Local and preview responses are fetched from `SEO_AUDIT_BASE_URL`, while canonical URLs are
checked against `SEO_AUDIT_CANONICAL_ORIGIN` (default: `https://www.goargentina.ru`).
The crawler still enforces page-level meta robots locally, but ignores the preview-wide
`X-Robots-Tag`. Set `SEO_AUDIT_ENFORCE_RESPONSE_NOINDEX=1` to enforce that header as well.

Checks:

1. `robots.txt`: response, content type and canonical sitemap directive
2. Sitemap structure: non-empty, unique URLs on the production origin, no query/hash
3. Full sitemap crawl: HTTP 200 without redirects, HTML response, indexable robots and self-canonical
4. Title, description, Open Graph, one H1 and duplicate metadata report
5. Parseability of every JSON-LD block plus expected types on tour, excursion and article samples
6. Hreflang self-reference, indexability and reciprocal links
7. Locale fallbacks remain `noindex` until explicitly published

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

## Remaining product work

- Publication-aware per-locale registry and per-locale slugs (E39.2)
- Automatic Lighthouse in CI (optional follow-up)
- `ItemList` JSON-LD on catalogs (breadcrumbs only in E78)

## Related

- [E39 i18n foundation](./i18n-e39.md)
- [Image audit report](./image-audit-report.md)
- [Motion performance notes](./motion-e61.md)
