# Iteration 2 — Public product, marketplace, content, SEO & UX hardening

Generated: 2026-08-19T04:10:00Z  
Agent branch: `cursor/iteration2-public-product-5475`  
Canonical production: https://www.goargentina.ru

## A. Executive verdict

**CONDITIONAL**

The public **code** surface is hardened for the known defects (expired marketplace dates, partner garbage copy, visa slug lifecycle, dormant search/nav leak, robots/search utility). The **live** production foundation from Iteration 1 is unchanged and still down. New deploys remain blocked by the Vercel account status.

Paid traffic: **NO-GO**.

## B. Regression check — Iteration 1

| Check | Result |
|-------|--------|
| Iteration 1 report present | Yes — `docs/project-governance/iteration1-production-truth/ITERATION1_REPORT.md` |
| I1 commits in ancestry | Yes — `07ffd5ca`, `b7925a22`, `b5fbad29` on Sprint 7 line |
| `origin/main` | `81055b1387e0062301ca9c0ae7468cbf782e2511` |
| Production `/api/health` `gitSha` | Same SHA |
| Health | **503 down** — REST 402 `exceed_egress_quota`; IPv6-only direct PG |
| I1 code rolled back? | No |
| I1 live blockers cleared? | No — not an Iteration 2 code task |

No infrastructure regression was introduced. Iteration 2 did not wait for DB recovery; runtime-dependent marketplace evidence is marked `BLOCKED_EXTERNAL`.

## C. Public inventory

Page templates from `src/app/**/page.tsx`: **159**

| Class | Count |
|-------|-------|
| CORE_INDEXABLE | 53 |
| CORE_NON_INDEXABLE | 96 |
| DORMANT | 7 |
| POST_LAUNCH | 2 |
| LEGACY_REDIRECT | 1 |

See `PUBLIC_ROUTE_MATRIX.csv`. Concrete production URLs sampled: 24 representative paths (home, catalogs, guide, KB, blog, geography, map, contacts, services, podbor, about, dormant, WP aliases, robots, sitemap, health).

## D. Fixed P0/P1 (code)

1. **Past marketplace dates as current offers** — filter + display + tests.
2. **Garbage partner copy** — quality layer + hide-on-card + tests (frying-pan phrase).
3. **`/baza-znaniy/viza-rf-v-argentinu`** — archived with `redirect_to` canonical article; search/nav cleaned.
4. **Dormant leak into search / unfiltered chrome** — header/footer/search fail closed; shop products removed from search index.
5. **Robots** — disallow KB search and `/api/`.
6. **`/st_location/*`** — hub redirect to `/places` (not homepage).

## E. Marketplace

See `MARKETPLACE_QUALITY_REPORT.md`. Live catalog on www is unavailable. Candidate will not advertise past dates or nonsense translations when feeds return.

## F. Content

- KB visa FAQ consolidated into `viza-i-granica-dlya-rossiyan` (facts unchanged; no invented legal rewrite).
- Guide / blog / places templates were sampled on production (200). Deep editorial rewrite of long-tail articles was not the bottleneck; systemic templates were.
- Related wikilink for archived visa slug follows `redirect_to`.

## G. SEO

See `SEO_REDIRECT_AUDIT.md`. Canonical host, preview noindex, sitemap lastmod honesty, WP hubs, visa archive redirect.

## H. UX

- Desktop/mobile: production chrome renders; catalog is empty because data plane is down.
- Dormant modules: 404 pages; footer on production already omits shop/forum; candidate also fail-closes when CMS navigation is missing.
- Accessibility-critical: no new contrast/focus regressions intended; Header/Footer still use existing tokens.
- Horizontal overflow: not solved by global `overflow-x: hidden`; date/copy bugs were the user-visible defects.

## I. Performance

No blind Server Component rewrite. Marketplace catalog still 300s revalidate; last-known-good is re-filtered. Homepage already streams catalog independently.

## J. Production evidence

| Item | Value |
|------|-------|
| `origin/main` | `81055b1387e0062301ca9c0ae7468cbf782e2511` |
| Production SHA | `81055b1387e0062301ca9c0ae7468cbf782e2511` |
| Candidate | `ad6752d31dfe93f7f765793d7494c66f6ab6d749` |
| Health | 503 down |
| Deploy | **BLOCKED_EXTERNAL** — Vercel “Account is blocked” |

## K. Remaining blockers

1. Supabase `exceed_egress_quota` on `uooxrypocahomoqzdvzy`.
2. IPv4 session pooler URL on Vercel.
3. Unblock Vercel account, then deploy this PR + verify visa 308 and live catalog dates.
4. Exact WP CPT → current slug map still needs GSC/Ahrefs export (accepted; hubs used, not homepage).

## L. Verdict for Iteration 3

**CONDITIONAL GO** for admin/CMS/CRM/organizer **code** hardening that does not require a healthy live data plane.

**NO-GO** for live authoring, CRM mutations, or paid traffic until Iteration 1 blockers are cleared and this public candidate is deployed and re-checked (defects A–D in the prompt).
