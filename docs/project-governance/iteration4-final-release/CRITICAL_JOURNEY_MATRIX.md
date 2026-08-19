# Critical journey matrix — Iteration 4

Probe time: 2026-08-19T04:37–04:43Z  
Production SHA: `81055b1387e0062301ca9c0ae7468cbf782e2511`  
Candidate SHA lineage: I1⊂I2⊂I3⊂I4 on `cursor/iteration4-final-release-5475`

Status: PASS | FAIL | BLOCKED_EXTERNAL

HTML 200 from a static/typed fallback is recorded honestly. It is **not** a
healthy data-plane pass.

| Journey | Step | Live production | Candidate code | Status |
|---------|------|-----------------|----------------|--------|
| Public discovery | home | 200, 182KB, 0.78s | same shell + I2 marketplace filters | PASS (shell) / FAIL (live catalog) |
| Public discovery | destinations | 200, 297KB | overlay + typed | PASS (shell) |
| Public discovery | places | 200, 481KB | geo + overlay | PASS (shell) |
| Public discovery | guide | 200 `/guide`, 200 `/guide/buenos-aires` | I2/I3 overlay | PASS (shell) |
| Public discovery | KB hub | 200 `/baza-znaniy` | overlay + files | PASS (shell) |
| Public discovery | visa legacy | 200 self-canonical `/baza-znaniy/viza-rf-v-argentinu` | I2 308 to `viza-i-granica-dlya-rossiyan` | FAIL live / fixed in candidate |
| Marketplace tour | list | 200 HTML; `/api/tours` 503 | fail-closed + bookable filter | FAIL (no live offers) |
| Marketplace tour | filters / card / detail / date / CTA | cannot complete | I2 date/copy gates | BLOCKED_EXTERNAL |
| Marketplace excursion | list | 200 HTML; `/api/excursions` 503 `catalog_unavailable` | same | FAIL (no live offers) |
| Marketplace excursion | detail / price / organizer / CTA | cannot complete | I2/I3 quality + ownership | BLOCKED_EXTERNAL |
| Map | map → marker → entity | `/mapa-argentina` 200, 451KB | existing map | PASS (shell) / BLOCKED_EXTERNAL (live markers) |
| Lead | form | `/contacts` 200 | security_critical rate limit | PASS (form render) |
| Lead | API → DB → CRM | Data API quota | I3 transitions + audit | BLOCKED_EXTERNAL |
| CMS | draft → preview → publish → public → update | not exercised live | I3 revalidate + unpublish | BLOCKED_EXTERNAL |
| Organizer | application → approval → own entity | `/organizer` 307 sign-in | I3 409/GET/RPC/ownership | BLOCKED_EXTERNAL |
| Admin | login gate | `/admin` 307 `?auth=sign-in&role=admin` | existing auth | PASS (gate) |
| Admin | mutation → persist → audit | not exercised | I3 audit on leads | BLOCKED_EXTERNAL |
| Auth surfaces | profile | `/profile` 307 sign-in | existing | PASS (gate) |
| Legacy WP | `/st_location/test` | 404 | I2 308 → `/places` | FAIL live / fixed in candidate |
| Search URL | `/search` | 404 | product search is chrome / KB poisk, not this path | N/A |
| Partner health | ops | `/api/health/partners` 503, all sources down | I3 admin panel | FAIL live / truthful |
| Payments | own checkout | POST_LAUNCH `productionEnabled: false` | gate retained | N/A (intentionally off) |

## Totals (business-critical rows, excluding N/A)

| Status | Count |
|--------|------:|
| PASS | 8 |
| FAIL | 5 |
| BLOCKED_EXTERNAL | 8 |

PASS rows are shells, auth gates, or truthful fail-closed APIs that still leave
the commercial journey incomplete. They do not justify GO.

## Business chains

| Chain | Status | Note |
|-------|--------|------|
| Discovery → marketplace → CTA → conversion | FAIL | Catalog APIs 503; no live handoff proof |
| Own lead → DB → CRM | BLOCKED_EXTERNAL | Form renders; persist/quota |
| Editorial → CMS → public → sitemap | BLOCKED_EXTERNAL | Files/typed still ship; CMS persist unproven |
| Organizer apply → approve → public → request | BLOCKED_EXTERNAL | Code contracts only |
