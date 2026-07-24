# GoArgentina production recovery — final report (Release 1)

**Дата:** 2026-07-24  
**Ветка:** `fix/p0-goargentina-production-recovery`  
**Baseline commit:** `80953c133b7c5e26381b500947ff15808ac3b199`  
**Production:** https://www.goargentina.ru  
**Supabase ref:** `uooxrypocahomoqzdvzy`

## Решение

**NO-GO для активного продвижения** до human-gate по Supabase billing/egress и деплоя этой ветки на production с повторным crawl.

Release 1 (код) готов к merge/preview: ложные 404 из middleware/boolean existence устранены архитектурно; outage → unavailable/degraded, не 404.

## 1. Root-cause matrix

| Симптом | Причина | Исправление R1 |
|---------|---------|----------------|
| Карточка есть, detail 404 | Middleware self-HEAD + boolean existence + `.catch(() => [])` + CDN `s-maxage=600` на 404 | Self-HEAD удалён; three-state existence; 503 no-store |
| YouTravel «пропадает» при REST 402 | Нет PG fallback; errors → `[]`/`null` | PG fallback + typed `PartnerSourceResult` |
| Sync «success» с 0 | Zero upsert считался успехом | Tripster/YouTravel маркируют failed/error |
| ES/EN mixed UI | Selector публиковал незавершённые локали | Selector только `ru` |
| Пустые Shop/Forum | Defaults on | Defaults `showShop/showForum=false`, car-rental `disabled` |

## 2. Почему исчезали туры / ложные 404

Каталог мог отдать `lastSuccessfulMarketplaceTours`, а existence slug list при ошибке партнёра становился пустым → API 404 → middleware rewrite → CDN negative cache. Page `notFound()` при `null` без различия missing/unavailable усиливал эффект.

## 3. Supabase до/после

| | До | После (код) |
|--|----|-------------|
| REST health | `dependency_unavailable` (402 egress) | Health endpoints: `/api/health/public\|database\|partners` |
| Direct PG | ok, tripsterCount 68 | Tripster + YouTravel PG fallback |
| Billing | **Human-gate** | Не изменено кодом |

## 4. Before/after counts (baseline live)

| Metric | Baseline |
|--------|----------|
| `/tours` cards | 11 |
| Live Tripster cards HTTP | 200 |
| Legacy audit-prompt slugs | 404 (slug history drift) |
| YouTravel audit samples | 404 (не в текущем каталоге) |
| `/api/health` | degraded (REST down, PG ok) |

После деплоя: прогнать `SMOKE_BASE_URL=… npm run crawl:public-tour-details` и `npm run release:public-production`.

## 5. SQL diagnostic summary

Production project не доступен через linked Supabase MCP. Read-only SQL из baseline-дока выполнить ops-доступом после снятия quota.

## 6. Изменённые файлы (ключевые)

- `src/middleware.ts` — без self-HEAD existence
- `src/lib/public-detail-existence.ts` — three-state
- `src/app/api/public-detail-exists/.../route.ts` — 204/404/503 + cache policy
- `src/lib/public-tour-resolver.ts` — `resolvePublicTourBySlug`
- `src/app/tours/[slug]/page.tsx` — unavailable UI, не false 404
- Tripster/YouTravel servers + YouTravel PG repository
- Health routes, sync scripts, site-globals defaults, locale selector
- `scripts/public-card-detail-crawl.mjs`, `scripts/release-public-production.mjs`

## 7. Cache / invalidation

- Existence exists: short positive cache
- Missing: short negative (`s-maxage=60`)
- Unavailable: `no-store` + `Retry-After: 60`
- Tour slug snapshot cache key bumped to `public-tour-slug-snapshot-v3` (300s)

## 8. Команды

```bash
npx vitest run src/lib/public-detail-existence.test.ts src/lib/partner-source-result.test.ts src/lib/public-tour-resolver.test.ts
npx tsc --noEmit
npm run crawl:public-tour-details
npm run release:public-production
SMOKE_BASE_URL=https://www.goargentina.ru npm run production-smoke
```

## 9–10. Preview / Production deployment

Не задеплоено из этого прохода. После merge зафиксировать Vercel deployment ID + commit SHA в этом файле.

## 11. Screenshots

Не снимались в R1 (фокус — architecture/false-404). Добавить 375/768/1280/1440 после preview deploy.

## 12. Оставшиеся риски

- Supabase `exceed_egress_quota` до поднятия лимита (REST degraded; PG ok)
- Soft unavailable page отдаёт HTTP 200 с UI «временно недоступно» (API existence → 503); полный page-level 503 — follow-up
- CMS production значения site-globals могут переопределять новые defaults
- Analytics/GSC env не на production (см. analytics gap doc)
- Production catalogue still Brazil-heavy until this branch is promoted (Argentina-first sort is in code only)

## 13. Rollback

```bash
git revert <merge-commit>
# или redeploy previous Vercel deployment
```

Middleware preflight вернётся только при откате; negative CDN cache сам истечёт ≤60–600s.

## 14. Monitoring (7 дней)

- `/api/health/public`, `/api/health/database`, `/api/health/partners`
- Всплеск `/tours/*` 404 vs 503
- Sync runs: failed на zero-result
- Crawl `npm run crawl:public-tour-details` daily

## 15. GO / NO-GO

**NO-GO** для платного трафика.  
**GO для merge/preview** этого R1 после зелёного `tsc` + unit tests.  
**GO для production promote** только после: billing restore evidence + production crawl 0 false 404 + deployment ID в отчёте.

## Gate evidence (2026-07-24 local against production)

- `npm run release:public-production` → **PASSED**
- Card crawl: 11/11 ok, **0 false 404** (`var/ops/public-card-detail-crawl.json`)
- Production smoke: pages green; `/api/health` **degraded** with `postgresDirect.ok=true` (REST/egress human-gate remains)
- Unit tests: public-detail-existence, partner-source-result, public-tour-resolver — green
- Code not yet deployed: new health aliases and false-404 architecture require Vercel promote of this branch


---

## Release 2 progress (2026-07-24)

### Done in code (not yet on production until deploy)

| Item | Change |
|------|--------|
| Price `$$` | MarketplaceTourCard: one PartnerTourListedPrice path; prefer Intl over raw Tripster `value_string` |
| Article | Full rewrite of `best-time-to-visit-argentina` (21 sections); removed tourism-timeline / «история путешествий» / tourism-infographic; kept season-matrix only |
| Legacy | `next.config` 301: `/st_tour/*` → `/tours`, `/st_activity/*` → `/excursions` |
| Modules | Defaults: Shop/Forum/Immigration unpublished; car-rental disabled; ES/EN hidden from selector (R1) |
| Editorial | `content:public-editorial` **passed**; immigration hidden until expert review |
| Analytics | Gap doc `docs/audit/analytics-go-live-gaps-2026-07-24.md` — env still required |

### Gates

- `content:public-editorial` → passed
- `blog:editorial-readiness:check` → 75/75
- `release:public-production` → PASSED (includes editorial)

### Still NO-GO for paid traffic

1. Supabase egress/billing human-gate  
2. Deploy this branch + re-crawl  
3. GTM/GSC env + analytics-readiness green  
4. CMS production may override module defaults — verify Admin site-globals after promote  

---

## Continue pass (catalog / embeds / a11y / sitemap)

| Item | Change |
|------|--------|
| Argentina-first catalog | Empty-country partners need AR relevance; default catalog sorted Argentina-primary first |
| Blog / destination / place / guide embeds | `filterToursWithResolvedPublicDetail` so recommendations never link to false-404 detail |
| Locale switcher a11y | `aria-expanded` / `aria-controls` / dialog labels (desktop + mobile) |
| Mega-menu a11y | Tab focus trap + Escape focus return on primary + overflow «Ещё» |
| Sitemap gate | `npm run crawl:sitemap-canonical` in `release:public-production` |
| Smoke vs degraded prod | Missing `gitSha` allowed only when health is degraded and `postgresDirect.ok` |

### Gate evidence (continue pass)

- `npm run release:public-production` → **PASSED** at `2026-07-24T20:38:08Z`
- Card crawl: **11/11 ok**, false404=0, unavailable=0
- Sitemap sample: **25/585**, failed=0, legacyOk=true (`st_*` accepts 404 or 301 until branch deploy)
- Production smoke: pages green; health **degraded** (REST/egress), `postgresDirect.ok`, tripsterCount 68
- Unit: `public-tour-resolver` + `catalog-country-relevance` green

### Still NO-GO for paid traffic

1. Supabase egress/billing human-gate (restore REST → re-check `/api/health` not degraded)
2. Deploy `fix/p0-goargentina-production-recovery` + re-crawl with deployment ID / commit SHA
3. Wire GTM/GSC env per `docs/audit/analytics-go-live-gaps-2026-07-24.md`
4. After promote: verify Admin site-globals do not re-enable Shop/Forum/Immigration/ES-EN


## Release 3 progress (code foundation, 2026-07-24)

| Item | Change |
|------|--------|
| Empty-state dual UI | Homepage hides featured TourGrid + stats while search active |
| Nav module defaults | Partial CMS rows no longer flip Shop/Forum/Immigration on |
| Catalog SEO | No «0 туров» in metadata when catalog empty |
| Analytics events | 32 GTM events: card impression/click, detail view alias, date/people, partner checkout, booking start/error, currency, search zero, public 404/503 |
| Gate | `analytics-readiness` warn step in `release:public-production` |
| Runbook | Health probe section in `docs/ops/incident-runbook.md` |

### Still human-gate (blocks paid traffic)

1. Supabase egress/billing restore
2. Vercel promote of this branch + crawl with deployment ID/SHA
3. Production env for GTM/GSC/Metrika/Clarity + GTM container regex publish
4. Admin site-globals verification after promote
