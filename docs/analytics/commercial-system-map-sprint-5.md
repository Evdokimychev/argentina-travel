# Sprint 5 — Commercial System Map

Дата: 2026-08-17. Источник правды: код (`src/lib/analytics/**`, `src/lib/attribution/**`, admin analytics) + readiness tooling.

## Принцип доверия

| Утверждение | Допустимо только при |
|---|---|
| EVENT | consent + schema + destination |
| CONVERSION / SALE | verified next-stage evidence |
| Partner handoff | controlled ingest / redirect proof |
| Partner revenue | partner dashboard / reconciliation |
| Own revenue | payment ledger charge completed |

Missing evidence → `UNKNOWN` / `NOT VERIFIED` / `UNAVAILABLE`, never `0` presented as success.

## Воронка и источники правды

| Stage | Event(s) | Storage | Dashboard | Proof level |
|---|---|---|---|---|
| SOURCE | first-touch UTM/referrer | cookie + session (`pva_ft_*`) | Admin bookings export / CRM context | CODE + STAGING |
| SESSION | envelope `session_id` | sessionStorage | GA4 / Metrika | CODE |
| CONTENT | `blog_article_view`, guide SSR | dataLayer (+ product events) | GA4 / content ROI panel | CODE |
| PRODUCT IMPRESSION | `tour_card_impression` | dataLayer | Partner funnel | CODE |
| PRODUCT DETAIL | `tour_view` / `excursion_view` + controlled `tour_view` | dataLayer + `analytics_events` | Admin funnels | CODE + LIVE ingest when DB up |
| BOOKING START | `booking_start`, `*_booking_click` | dataLayer + controlled | Admin funnels | CODE |
| INTERNAL LEAD | `contact_form_submit` / booking submit native | `contact_submissions` / bookings | Admin leads / CRM | STAGING/PROD test |
| PARTNER HANDOFF | `partner_checkout_click` | dataLayer + controlled | Admin funnels (`trustedForKpi=false` for handoff-as-sale) | CODE + click log |
| CONFIRMATION | `booking_confirmed` / CRM status | bookings CRM | Admin bookings | LIVE business |
| PAYMENT | ledger charge | payments ledger | Admin analytics | OWN_PAYMENT disabled |
| PARTNER OUTCOME | reconciliation | partner export / API | Ops report | PARTNER DASHBOARD |
| REVIEW | published reviews only | reviews table | Admin analytics | LIVE |

## Commercial modes (production)

См. `src/lib/commerce/business-model.ts`:

- OWN_LEAD — enabled
- PARTNER_REDIRECT — enabled
- AFFILIATE — enabled
- OWN_BOOKING — enabled (request, not payment)
- OWN_PAYMENT — **intentionally disabled**

## Promotion gate semantics

`npm run promotion:gate` пишет:

- `technicalReadiness` — contracts + release + health
- `commercialProofReadiness` — live claims ≠ local-contract
- `paidTrafficDecision` — оба GO

Local commercial-funnel vitest **не** даёт Paid Traffic GO.
