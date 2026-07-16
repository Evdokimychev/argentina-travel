# Search index report

**Release:** 2026-07

**Checked:** 2026-07-15

**Production:** `https://www.goargentina.ru`

**Assessment:** conditional pass for user-facing search; not release-complete for index observability and integrity.

## Executive summary

Production search returns relevant results and has a working degradation chain. Five representative Russian queries all returned five results from PostgreSQL in 116–335 ms. Empty queries return an empty result immediately, and the API caps the requested result limit at 20.

The release still has three material gaps:

1. The public 323-document content index contains three duplicate IDs.
2. Meilisearch health and document count are not confirmed. The existing readiness artifact records it as unconfigured in its environment, while production queries used PostgreSQL.
3. Invalid `kind` values and at least one broad one-character query fell through to the static provider and took more than two seconds.

## Architecture observed

The query path in `src/lib/search/search-query.ts` is:

1. Meilisearch, when configured and returning results.
2. PostgreSQL full-text search through `search_site_documents`.
3. In-process static index as a fallback.

PostgreSQL uses a generated weighted `tsvector`, a GIN index and `websearch_to_tsquery('russian', ...)` from `supabase/migrations/20250623000000_search_documents.sql`. The API publishes `Server-Timing: search;dur=...` and a 30-second CDN cache with 120 seconds stale-while-revalidate.

The CMS has per-document synchronization in `src/lib/search/cms-search-sync.ts`. A full reindex upserts current rows and removes stale IDs in `src/lib/search/search-indexer.ts`. The query path triggers a full reindex only when the PostgreSQL table is empty; it does not detect a non-empty but stale index.

## Production index inventory

Read-only request: `GET /api/site/search-index`, HTTP 200 at 2026-07-15T03:14:33Z.

| Type | Documents |
|---|---:|
| Place | 100 |
| Blog | 87 |
| Page | 69 |
| Guide | 19 |
| FAQ | 17 |
| Destination | 14 |
| Immigration | 11 |
| Legal | 6 |
| **Total** | **323** |

Integrity observations:

- Missing titles: **0**.
- Missing hrefs: **0**.
- External hrefs: **0**.
- Private/auth/admin-looking hrefs: **0**.
- Duplicate non-FAQ href groups: **0**.
- Duplicate ID groups: **3**.

Duplicate IDs:

| ID | Conflicting destinations |
|---|---|
| `nav-excursions-ba` | `/excursions/city/Buenos_Aires`; filtered catalog URL for Buenos Aires |
| `nav-excursions-iguazu` | `/excursions/city/Puerto_Iguazu`; filtered catalog URL for Puerto Iguazu |
| `nav-excursions-ushuaia` | `/excursions/city/Ushuaia`; filtered catalog URL for Ushuaia |

The deduplicator is href-based, so these records survive because their hrefs differ. Any downstream index keyed by `id` can overwrite one of the two records. This is a **P1 integrity finding**.

## Query smoke test

Read-only production requests to `GET /api/search?limit=5`:

| Query | Source | Results | Server-reported time | First result |
|---|---|---:|---:|---|
| Аргентина | PostgreSQL | 5 | 335 ms | Роды в Аргентине |
| Патагония | PostgreSQL | 5 | 121 ms | Патагония |
| Буэнос-Айрес | PostgreSQL | 5 | 116 ms | Буэнос-Айрес |
| виза | PostgreSQL | 5 | 277 ms | Визы для туристов: основы |
| экскурсия | PostgreSQL | 5 | 304 ms | Каталог экскурсий |

Median server-reported time was **277 ms**; the slowest of this small sample was **335 ms**. This is a smoke sample, not a p75/p95 latency measurement.

Edge cases:

- Missing, empty and whitespace-only queries: HTTP 200, zero results, 0 ms reported.
- `limit=9999`: safely capped at 20 results.
- One-character query `а`: static fallback, 20 results, 2565 ms.
- Valid query with `kind=invalid`: static fallback, 20 results, 2150 ms.

Unknown kinds should be rejected or ignored before the PostgreSQL RPC call. The current behavior converts a cheap validation error into a slow full static fallback. This is a **P1 latency and input-contract finding**.

## Coverage and freshness

The public `/api/site/search-index` endpoint exposes the content/static portion of the index and does not include tour or excursion records. The main `/api/search` endpoint does return tours through PostgreSQL, so the endpoint inventory must not be interpreted as the full production search corpus.

Current evidence does not expose:

- PostgreSQL `search_documents` total count and counts by kind;
- newest and oldest `updated_at` values by kind;
- CMS source count versus indexed count;
- orphaned search documents;
- indexing lag after publish/unpublish;
- Meilisearch document count, task status or last successful sync;
- p50/p75/p95 search latency over real traffic;
- zero-result rate and result-click rate.

The existing `var/ops/search-readiness-last.json` was generated on 2026-07-01. It reports `configured: false`, with no Meilisearch health or document count. That describes the environment where the script ran, not conclusively the current production environment. Five production smoke queries selecting PostgreSQL are consistent with Meilisearch being absent, empty or returning no hits.

## Regression evidence

A focused test run on 2026-07-15 passed 33 tests across six files. Search-specific checks confirm:

- navigation lists only indexable recent blog posts;
- the static index excludes `noIndex` blog posts.

The production SEO artifact also reports 1172 sitemap URLs with no status or i18n issues. Sitemap health and internal search health remain separate concerns.

## Release actions

| Priority | Action | Acceptance evidence |
|---|---|---|
| P1 | Make every navigation-derived search ID unique and add an index-wide unique-ID test. | Zero duplicate IDs in both static and full indexes. |
| P1 | Validate `kind` against supported types before provider calls. | Invalid kind returns 400 or is ignored; no static fallback penalty. |
| P1 | Add a production-safe index-health report for PostgreSQL count, counts by kind, stale rows and latest update. | Machine-readable artifact with timestamp and pass/fail thresholds. |
| P1 | Confirm the intended Meilisearch production posture. | Either configured health plus document count, or an explicit PostgreSQL-only decision with Meilisearch checks removed from release expectations. |
| P2 | Add freshness reconciliation after CMS publish, unpublish and delete. | Source/index counts match and stale document count is zero. |
| P2 | Record search p50/p75/p95, fallback rate, zero-result rate and click-through. | Dashboard or release artifact based on real traffic. |
| P2 | Add quality fixtures for top Russian intents and typo/morphology cases. | Deterministic relevance tests for destinations, visas, tours and excursions. |

## Source evidence

- `var/ops/search-readiness-last.json`
- `var/ops/seo-audit-last.json`
- `src/lib/search/search-query.ts`
- `src/lib/search/search-indexer.ts`
- `src/lib/search/cms-search-sync.ts`
- `src/lib/site-search-index.ts`
- `src/lib/sprint1-stabilization.test.ts`
- `supabase/migrations/20250623000000_search_documents.sql`
- Read-only production responses from `/api/site/search-index` and `/api/search`
