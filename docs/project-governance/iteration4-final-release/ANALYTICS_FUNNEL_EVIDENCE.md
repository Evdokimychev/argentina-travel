# Analytics funnel evidence — Iteration 4

Code events are not analytics. Downstream YM/GTM access was not available.

## Contract (existing names — no new taxonomy)

Marketplace / conversion (GTM + product events):

- `tour_card_impression` / `tour_card_click` / `tour_view`
- `excursion_view` / `tour_booking_click` / `excursion_booking_click`
- `partner_checkout_click`
- `booking_start` / `booking_submit` / `contact_form_submit`
- product: `booking_started` / `booking_created` / `site_search_*`

Content:

- `blog_article_view` / `article_opened` / `related_content_clicked`
- `destination_opened` / `place_opened` / `map_*`

Consent:

- Default: analytics denied.
- `hasAnalyticsConsent()` gates YM loader, GTM custom events, product events.
- Google Consent Mode v2 defaults deny ad/analytics storage.

PII: `sanitizeAnalyticsParams` / event contract. No emails/phones in event names.

## Live proof

| Check | Result |
|-------|--------|
| GET `/api/analytics/events` | 405 (POST-only; no accidental dump) |
| Consent before scripts | unit tests PASS |
| Duplicate conversion names | legacy aliases documented; emitters must not dual-fire |
| Production interaction → YM/GTM UI | **BLOCKED_EXTERNAL** |
| Server accept of POST events | not exercised against production (would be empty/unverified under quota) |

## Attribution

UTM/referrer/source fields exist on the product event contract. End-to-end
preservation to a conversion record is **BLOCKED_EXTERNAL**.

## Verdict

Analytics **code funnel**: PASS.  
Analytics **live dispatch/downstream**: BLOCKED_EXTERNAL.  
This is classified as a non-code limitation. It is **not** enough to call
the growth stack production-proven, and it is **not** a reason to ignore
the P0 data-plane NO-GO.
