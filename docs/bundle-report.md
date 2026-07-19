# Bundle report

Generated: 2026-07-18

## Summary

- Client JS chunks: **42** files, **78557.8 KB** total
- Public-surface chunks (excl. organizer/admin/profile/api): **40** files, **78532.4 KB**
- Root layout chunk(s): **0.0 KB** (0 file(s))
- Organizer route chunks: **0.0 KB** (not in public layout)
- MapLibre-related chunks: **4893.5 KB** (budget ≤ 450 KB)
- MapLibre budget: ⚠️ over budget
- Public layout budget (≤ 10240 KB): ⚠️ over budget

## Sprint 10 trim (vs baseline)

- Baseline total client JS: **12044.6 KB**
- Target (−15 %): **10237.9 KB** public-surface total
- Current public-surface: **78532.4 KB** (+552.0 % vs baseline)
- Trim target: ⚠️ manual follow-up — run ANALYZE=true npm run build

## Top 20 client chunks

| Size | File |
|------|------|
| 19492.2 KB | `.next/static/chunks/app/tours/[slug]/page.js` |
| 10275.7 KB | `.next/static/chunks/app/tours/page.js` |
| 10135.3 KB | `.next/static/chunks/_app-pages-browser_src_lib_tour-itinerary-pdf_download-tour-itinerary-pdf_tsx.js` |
| 7519.0 KB | `.next/static/chunks/main-app.js` |
| 5317.0 KB | `.next/static/chunks/app/layout.js` |
| 5215.1 KB | `.next/static/chunks/_app-pages-browser_node_modules_sentry_nextjs_build_esm_index_client_js.js` |
| 2663.2 KB | `.next/static/chunks/_app-pages-browser_src_lib_supabase-auth-provider_ts.js` |
| 2562.6 KB | `.next/static/chunks/_app-pages-browser_src_lib_supabase_client_ts.js` |
| 2482.9 KB | `.next/static/chunks/_app-pages-browser_src_components_map_ArgentinaMapLibreCanvasInner_tsx-_ca7e0.js` |
| 2410.6 KB | `.next/static/chunks/_app-pages-browser_src_components_map_ArgentinaMapLibreCanvasInner_tsx-_ca7e1.js` |
| 1317.5 KB | `.next/static/chunks/_app-pages-browser_src_components_marketplace_CatalogMapView_tsx.js` |
| 1284.6 KB | `.next/static/chunks/_app-pages-browser_src_components_tour-detail_RouteMap_tsx.js` |
| 1223.5 KB | `.next/static/chunks/_app-pages-browser_node_modules_leaflet_dist_leaflet-src_js.js` |
| 734.1 KB | `.next/static/chunks/_app-pages-browser_src_components_marketplace_CatalogFiltersSheet_tsx.js` |
| 709.9 KB | `.next/static/chunks/_app-pages-browser_src_components_marketplace_FilterBar_tsx.js` |
| 644.6 KB | `.next/static/chunks/app/tours/[slug]/error.js` |
| 643.7 KB | `.next/static/chunks/app/tours/error.js` |
| 643.5 KB | `.next/static/chunks/app/error.js` |
| 567.7 KB | `.next/static/chunks/_app-pages-browser_src_components_auth_AuthModal_tsx.js` |
| 401.2 KB | `.next/static/chunks/_app-pages-browser_src_components_quick-explore_QuickExploreDialogHost_tsx.js` |

## Commands

```bash
npm run build
npm run bundle:report
ANALYZE=true npm run build   # interactive @next/bundle-analyzer
```
