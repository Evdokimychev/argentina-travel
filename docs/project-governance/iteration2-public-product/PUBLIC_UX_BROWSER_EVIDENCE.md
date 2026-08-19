# Iteration 2 — public UX / browser evidence

Generated: 2026-08-19  
Production artifact: `81055b1387e0062301ca9c0ae7468cbf782e2511`  
Candidate: `cursor/iteration2-public-product-5475` (not on production)

## Production HTTP sample

| URL | Status | Notes |
|-----|--------|-------|
| `/` | 200 | Hero and navigation render. Marketplace cards not populated (data plane down). Footer has no shop/forum. |
| `/tours` | 200 | Empty/filter empty-state, not a crash. |
| `/excursions` | 200 | Catalog shell. |
| `/guide` | 200 | Guide hub. |
| `/baza-znaniy` | 200 | KB hub. |
| `/baza-znaniy/viza-rf-v-argentinu` | 200 | Still a live FAQ on **old** production SHA. Candidate archives + 308 to canonical. |
| `/baza-znaniy/viza-i-granica-dlya-rossiyan` | 200 | Canonical visa/border article. |
| `/blog` `/places` `/destinations` `/mapa-argentina` `/contacts` `/services` `/podbor` `/about` | 200 | Representative public shells. |
| `/shop` `/forum` `/car-rental` | 404 | Dormant modules do not leak as pages. |
| `/st_tour/legacy-example` | 308 → `/tours` | Catalog hub, not homepage. |
| `/st_activity/legacy-example` | 308 → `/excursions` | Catalog hub, not homepage. |
| `/st_location/foo` | 404 | New `/places` hub redirect is in candidate only. |
| `/robots.txt` `/sitemap.xml` | 200 | Indexing files present. |
| `/api/health` | 503 | Iteration 1 data-plane outage unchanged. |

## Visible copy checks (production HTML)

- No «сковороде» / frying-pan phrase in homepage HTML.
- No visible `undefined` / `NaN` in homepage text (only in bundled JS identifiers).
- No June/July 2026 marketplace date pills on homepage — catalog is not serving live cards.
- Tours visible copy: «Туры не найдены / Попробуйте изменить фильтры» — empty-state, not a soft 404 title. Data-plane honesty remains limited until partner/DB recovery.

## Candidate code coverage (not yet on production)

- Past departures stripped for platform **and** partner cards; card/modal display re-filters by Argentina calendar day.
- Partner garbage copy is hidden, not rewritten into fake facts.
- Header/footer/search fail closed to `DEFAULT_SITE_NAVIGATION` + `DEFAULT_SITE_MODULES`.
- Archived visa FAQ is removed from public KB catalog and search.

No large screenshot set is stored in git.
