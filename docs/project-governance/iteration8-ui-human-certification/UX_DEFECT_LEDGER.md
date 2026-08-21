# UX / Functional defect ledger — Iteration 8

Generated: 2026-08-21  
Environments: Vercel preview (I7 SHA lineage) + candidate `cursor/iteration8-ui-human-certification-5475`

| ID | Sev | Surface | Defect | Status | Evidence |
|----|-----|---------|--------|--------|----------|
| P0-I8-001 | P0 | `/podbor` | Catalog outage threw → global «Не удалось загрузить страницу» on primary CTA «Подобрать маршрут» | **fixed** | `i8-phase-c-10-quiz-matcher-error.png`; `fetchMarketplaceToursSafely` + Podbor notice |
| P1-I8-001 | P1 | `/tours` | Outage rendered as «Туры не найдены / измените фильтры» | **fixed** | `i8-p1-tours-page-no-tours.png` |
| P1-I8-002 | P1 | about/places/region/organizers/embed | Sibling pages also awaited raw `fetchMarketplaceTours()` and could crash | **fixed** | systemic `fetchMarketplaceToursSafely` |
| P2-I8-001 | P2 | SiteSearch | Stale previous hits while typing new query | **fixed** | `i8-p1-search-buenos-aires-stuck.png` |
| P2-I8-002 | P2 | Catalog/API | Live DB down → tours 503 / excursions error | BLOCKED_EXTERNAL (honest UX improved) | health 503 |
| P2-I8-003 | P2 | Auth | End-to-end register/login blocked by backend | BLOCKED_EXTERNAL; failure UX OK | `i8-auth-*.png` |
| P3-I8-001 | P3 | AuthModal | Native HTML5 English tooltips over Russian UI | **fixed** (`noValidate` on email form) | Phase B report |
| P3-I8-002 | P3 | Search | Debounce delay on first results | open | Phase A |
| NOTE | — | Organizer apply | Correct path is `/join` (agent 404 on `/organizer-application` was wrong URL) | N/A | `/join` 200 |

## WHAT LOOKED IMPLEMENTED IN CODE BUT FAILED AS A USER

1. Homepage CTA «Подобрать маршрут» → `/podbor` looked wired but **hard-failed** on catalog outage.
2. `/tours` looked to have outage handling (home did) but catalog page **lied** with filter empty-state.
3. Auth flows look complete in UI but mutations **cannot finish** while data plane is down.

## WHAT WORKED BUT WAS TOO CONFUSING

- Tours page showed both «Туры не найдены» and (elsewhere on home) honest catalog copy — inconsistent mental model.

| P2-I8-004 | P2 | `/join` authors | Empty `image: ""` → Next/Image console errors | **fixed** | destination covers assigned |
| P3-I8-003 | P3 | `/contacts` | English HTML5 required tooltip | **fixed** (`noValidate`) | local adversarial pass |
| NOTE | — | `/mapa-argentina` local | WebGL fail on agent VM (llvmpipe); preview map loads | env limitation | preview OK earlier |

| P3-I8-004 | P3 | Footer newsletter | English HTML5 empty-field tooltip | **fixed** (`noValidate`) | i8-pass3 |

| P1-I8-003 | P1 | `/booking/find` | Opaque 500 when lookup secret missing | **fixed** → 503 Russian message | pass4 |

| P1-I8-004 | P1 | SiteSearch | Infinite «Идём…» when `/api/search` stalls (reindex/CMS collectors) | **fixed** client 6s timeout + server budgets + offline static fallback | `i8-search-timeout-*.png` |
| P1-I8-005 | P1 | `/destinations/[slug]` | Marketplace deadline threw → «Не удалось загрузить раздел» | **fixed** `fetchMarketplaceToursSafely` + honest tour empty | `i8-pass6-destination-ba-fixed.png` |
| P2-I8-005 | P2 | `/booking/find` | SmartInput «Готово» looked like request success before submit | **fixed** `showValidationSuccess={false}` | `i8-pass6-booking-find-after.png` |
| P2-I8-006 | P2 | `/excursions` | Catalog outage used route error shell instead of in-page honesty | **fixed** `fetchExcursionsResultServer` + empty copy | pass7→fix |
| P3-I8-005 | P3 | Mobile menu | Контакты only in desktop utility bar | **fixed** utility CTA in mobile menu footer | pass6 |

| P2-I8-007 | P2 | `/contacts` form | Empty/invalid submit hit network and showed generic «Не удалось отправить» | **fixed** submit-time field validation | `i8-pass9-contacts-validation-fixed.png` |

| P3-I8-006 | P3 | Share button | Web Share failure left no clipboard feedback | **fixed** AbortError quiet; else copy URL | pass10 |
| P2-I8-008 | P2 | `/podbor` | Draft selection lost on refresh before «Продолжить» | **fixed** session `draftSelection` | pass12 |

| P1-I8-006 | P1 | `/blog/[slug]` | CMS outage threw hard «Не удалось загрузить блог» for missing-seed paths | **fixed** catch → catalog/seed soft path | pass14 |
| P2-I8-009 | P2 | `/organizers` | SEO path existed but index 404 | **fixed** public organizers index | pass14 |

| P2-I8-010 | P2 | SiteSearch | Empty live hits hid local index matches (blank / endless «Ищем…» feel) | **fixed** prefer fallbackResults when live empty | pass15 |
| P3-I8-007 | P3 | `/booking/find` | Native English HTML5 empty-field tooltip | **fixed** `noValidate` | pass15 |
| P1-I8-007 | P1 | CI a11y mobile `/destinations/patagonia` | `scrollable-region-focusable` on HubQuickFactsGrid carousel | **fixed** `scrollRegionLabel` + tabIndex | CI verify-release |
| P1-I8-008 | P1 | `/excursions` | Catalog fetch could hang past SEO/UI budgets under partner outage | **fixed** `fetchExcursionsResultSafely` 2.5s deadline | CI + prod hang |
| CI | — | verify-contracts | Stale `interaction-inventory.csv` after BookingLookup `noValidate` | **fixed** `inventory:generate` | CI |
