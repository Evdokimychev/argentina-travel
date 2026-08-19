# Iteration 2 — SEO / redirect audit

## Canonical / robots / sitemap (code)

- Production host `www.goargentina.ru` is the only indexable host (`isCanonicalIndexingRequest`).
- Preview / localhost cannot inherit CMS `allowIndexing`.
- Sitemap lastmod is taken from content/blog/legal dates, **not** `Date.now()`.
- Shop, forum, car-rental, transfers are filtered from sitemap via launch guards + module visibility.
- KB search `/baza-znaniy/poisk` is `noindex` and now also `Disallow` in robots, together with `/api/`.

## Legacy WordPress

| Source | Destination | Policy |
|--------|-------------|--------|
| `/st_tour/:path*` | `/tours` | Catalog hub. Not homepage. Exact CPT→slug map is still absent in-repo. |
| `/st_activity/:path*` | `/excursions` | Same. |
| `/st_location/:path*` | `/places` | Added this iteration (candidate). Production still 404 until deploy. |

No catch-all to `/`.

## Knowledge archive

Archive redirects are generated from `content/knowledge-base/_index/content.json` (`loadKnowledgeArchiveRedirects`).

| Old | Canonical | Status |
|-----|-----------|--------|
| `/baza-znaniy/viza-rf-v-argentinu` | `/baza-znaniy/viza-i-granica-dlya-rossiyan` | Archived FAQ + permanent redirect in candidate. Production SHA still serves the FAQ as 200. |

Search and public KB catalog no longer include the archived slug. Wikilinks resolve through `resolvePublicKbId`.

## Soft 404

Representative production shells return real 200 with page chrome, not «что-то пошло не так» as the document title. `/shop` `/forum` `/car-rental` return **404**, not empty 200.

Catalog empty copy on `/tours` is an empty-state, not an HTTP 404. Distinguishing empty vs source-down still depends on deploying earlier catalog-unavailable work and a healthy data plane.
