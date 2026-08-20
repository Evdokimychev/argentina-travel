# Partner operations evidence — Iteration 3

## Pipeline (existing + I2 quality gate)

provider fetch → raw payload → validation → normalization → dedupe → `evaluateOfferQuality` → quarantine/reject → publishable catalog card.

I2 already hides past-only dates and garbage copy. Iteration 3 does **not** invent a second quality framework.

## Admin visibility

- `/api/health/partners` + `PartnerFeedHealthPanel` on settings **and** operations hub.
- Operations summary counts Tripster/Sputnik8 `ok=false` as stale/down.
- `/api/admin/partners/operations` documents field ownership and state labels (auth required).

Quarantine is **derived** at catalog time (`offer-quality.ts`). There is no separate quarantine table. Admin understands “why not public” via reasons on the quality gate (`MISSING_IDENTITY`, `INVALID_PRICE`, `STALE_SOURCE`, `CONTENT_QUALITY_SUSPECT`, …).

## Field ownership

| Field | Owner |
|---|---|
| price, dates, booking URL | provider-owned |
| title, shortDescription, image, destination | overrideable |
| slug, qualityState | derived |

Sync must not silently overwrite editorial overlays when an override is stored. Enforcement remains in existing partner mappers + quality filter.

## Idempotency / stale

Repeat sync must not create public duplicates (existing partner identity keys). Stale/critical freshness already classifies offers out of bookable catalog. Live sync replay is `BLOCKED_EXTERNAL`.

## Raw payload

No new unbounded raw dump. Debug remains last sync run status/error on health probes.
