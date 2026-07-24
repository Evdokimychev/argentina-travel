# GoArgentina production recovery — baseline

**Дата:** 2026-07-24  
**Ветка:** `fix/p0-goargentina-production-recovery`  
**Commit SHA (local start):** `80953c133b7c5e26381b500947ff15808ac3b199`  
**Production URL:** https://www.goargentina.ru  
**Vercel request id (sample):** `gru1::iad1::rpbfg-1784923955108-c537aeff3c10`  
**Supabase project ref (from env hostname):** `uooxrypocahomoqzdvzy`  
**MCP note:** project `uooxrypocahomoqzdvzy` is not in the linked Supabase MCP org list; SQL diagnostics against production must use direct PG / ops runbooks. Linked MCP projects do not contain partner tour tables.

## Health (`GET /api/health`)

| Check | Result |
|-------|--------|
| Overall | `ok: false`, `status: degraded` |
| REST / Data API (`database`) | `dependency_unavailable` (matches prior `402 exceed_egress_quota` Auth/API symptoms) |
| Search index | `dependency_unavailable` |
| Direct Postgres | `ok: true`, `tripsterCount: 68` |
| gitSha | `80953c133b7c5e26381b500947ff15808ac3b199` |
| migrationVersion | `20260720230600_final_explicit_data_api_grants` |

**Human-gate:** restore Supabase billing / egress quota for `uooxrypocahomoqzdvzy`. Code changes must not turn REST outages into HTTP 404.

## Public catalog / detail (live HTTP)

| Surface | Status |
|---------|--------|
| `/` | 200; home shows tour cards and «11 тур» copy |
| `/tours` | 200; **11** unique `/tours/{slug}` card hrefs |
| Sample Tripster cards from live catalog | **200** |
| Audit-prompt legacy slugs (old titles) | **404** (slug history drift vs live catalog) |
| YouTravel sample from audit prompt | **404** (not in current 11-card catalog) |
| `HEAD /api/public-detail-exists/tours/argentina-buenos-ayres-4-dnya-yt55496` | **404** |

### Live catalog slugs (2026-07-24)

1. `chudesa-brazilii-rio-i-dzhungli-amazonii-dzhiping-v-natsparke-halapao-i-vodopady-t70643`
2. `vlyubitsya-v-prirodu-yuzhnoy-ameriki-bolshoe-aktivnoe-puteshestvie-v-patagoniyu--t92278`
3. `ot-buenos-ayresa-do-kraya-sveta-bolshoy-fototur-po-znakovym-lokatsiyam-argentiny-t109207`
4. `granitsa-treh-stran-braziliya-argentina-paragvay-t80046`
5. `paragvay-s-zapada-na-vostok-i-vodopady-iguasu-so-storony-2-stran-individualnyy-t-t104730`
6. `v-ritme-samby-v-braziliyu-na-karnaval-t79362`
7. `braziliya-ot-i-do-5-shtatov-i-vip-mesta-na-karnavale-v-rio-de-zhaneyro-t71960`
8. `voploschenie-brazilskoy-dushi-vodopady-iguasu-dzhungli-amazonii-i-karnaval-v-rio-t81861`
9. `po-kontrastnoy-argentine-v-ritme-tango-buenos-ayres-patagoniya-vodopady-iguasu-i-t108535`
10. `karnaval-amazoniya-i-vodopady-iguasu-tropicheskoe-priklyuchenie-v-brazilii-i-arg-t70760`
11. `bolshoy-tur-v-argentinu-chili-i-braziliyu-trekkingi-v-patagonii-vodopady-iguasu--t92532`

## Architecture risks (pre-fix)

1. Middleware self-HEAD to `/api/public-detail-exists` rewrites true HTTP 404 with `s-maxage=600`.
2. Existence boolean + partner `.catch(() => [])` collapses outages into «missing».
3. YouTravel has no PG fallback; REST outage empties YouTravel slug sets while catalog may keep `lastSuccessfulMarketplaceTours`.
4. Catalog cache (300s + last-success) diverges from slug cache (600s).
5. Page `notFound()` on `fetchTourDetail === null` has no unavailable state.

## Modules / locales / analytics (baseline)

| Item | Observation |
|------|-------------|
| Shop / Forum | Defaults `showShop`/`showForum` true in site-globals normalize |
| Locales | `/es`/`/en` rewrite + noindex; selector still offers languages; hreflang registry empty |
| Analytics | Separate `analytics-readiness` gate; not blocking false-404 fix in R1 |

## Read-only SQL (intended; production MCP unavailable)

```sql
select slug, count(*) from public.tripster_experiences group by slug having count(*) > 1;
select slug, count(*) from public.youtravel_tours group by slug having count(*) > 1;
select id, status, experiences_synced, started_at, finished_at
from public.tripster_sync_runs order by started_at desc limit 20;
select id, status, tours_fetched, started_at, finished_at
from public.youtravel_sync_runs order by started_at desc limit 20;
```

## Release 1 goal

Eliminate false 404s under partner/DB outage; keep confirmed missing as 404; surface unavailable as 503/degraded; hide unfinished locales and empty modules from public HTML.
