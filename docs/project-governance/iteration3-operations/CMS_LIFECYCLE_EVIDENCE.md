# CMS lifecycle evidence — Iteration 3

## Source of truth

| Family | Cutover flag | Public reader when flag false | Writer | Iteration 3 change |
|---|---|---|---|---|
| Blog | `cmsBlogCutover` default false | typed/file + CMS overlay | CMS `content_documents` | Cache revalidate after mutate |
| Guide | `cmsGuideCutover` default false | typed/file + overlay | CMS | same |
| Destination | `cmsDestinationCutover` default false | structured + overlay | CMS | same |
| Place | `cmsPlaceCutover` default false | geo + optional CMS | CMS / geo | same |
| Knowledge | none | markdown/`content.json` + overlay | CMS overlay + repo files | Documented; no mass flip |
| Landing | none | typed/file + overlay | CMS overlay | Documented; no mass flip |

Two writable competing sources are not enabled. Cutover flags stay false until parity is proven.

## Lifecycle (code-complete)

create → save draft → edit → preview (admin session + sessionStorage) → validate → publish → public render (after cache tags/paths) → edit published → republish → unpublish (`POST .../unpublish` → status `draft`) → archive (status `archived`) → slug change still requires redirect admin when SEO-critical.

Preview remains admin-session only. Signed public preview tokens are not introduced (would expand attack surface without live CMS proof).

## Cache

`revalidateCmsPublicSurfaces` runs after create(published), update, publish, unpublish, schedule, unschedule, restore, scheduled publish, delete. Tags include `cms`, `blog-catalog`, `knowledge`, family tag. Paths include listing + detail + `/sitemap.xml`.

## Live E2E

`NOT_PROVEN` — production data plane 503 (`exceed_egress_quota`). Unit/source contracts cover validation, unpublish helper, and path mapping.

## What was not flipped

No `cms*Cutover=true` in production. Knowledge archive redirects stay in `knowledge-archive-redirects.ts`, not CMS `archived`.
