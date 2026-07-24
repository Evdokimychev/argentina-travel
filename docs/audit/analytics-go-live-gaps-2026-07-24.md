# Analytics go-live gaps — 2026-07-24

## Status

Код conversion-событий готов (32 `GTM_EVENTS`). `npm run analytics-readiness` против production остаётся **NO-GO**, пока на Vercel не заданы env и не сделан redeploy.

`release:public-production` запускает `analytics-readiness` как **warn** (не блокирует при отсутствии env).

## Required env (production)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_GTM_ID` | GTM container — unlocks snippet + Consent Mode default |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | Reference for GTM GA4 tag |
| `NEXT_PUBLIC_YANDEX_METRIKA_ID` | Direct Metrika loader |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | Clarity |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | GSC meta |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Bing |

## Wired in code

| Event | Status |
|-------|--------|
| `tour_card_impression` / `tour_card_click` | MarketplaceTourCard |
| `tour_view` + `tour_detail_view` | tour detail |
| `tour_date_select` / `tour_people_change` | TourBookingContext |
| `partner_checkout_click` / `booking_start` | trackTourBookingClick |
| `booking_submit` / `booking_error` | checkout modal |
| `locale_switch` + `locale_change` / `currency_change` | LocaleCurrencySwitcher |
| `search_submit` / `search_zero_results` | SiteSearch |
| `public_404` / `public_503` | not-found + TourUnavailableView |

## After env

1. Redeploy production
2. `ANALYTICS_BASE_URL=https://www.goargentina.ru npm run analytics-readiness`
3. Publish GTM container with Consent Settings; update Custom Event regex (see `docs/analytics-gtm-setup.md`)
4. Verify GA4 DebugView / Metrika goals

Do not start paid traffic until this checklist is green.
