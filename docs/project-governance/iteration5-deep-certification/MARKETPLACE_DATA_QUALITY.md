# Marketplace Data Quality — Iteration 5

## Live scan

| Metric | Value | Evidence |
|--------|------:|----------|
| `/api/tours` | 503 | production 2026-08-19 |
| `/api/excursions` | 503 `catalog_unavailable` | production 2026-08-19 |
| Active listings counted live | **0 readable** | Data API 402 / PG unreachable |
| Invalid / duplicate / $0 prices live | **NOT_SCANNABLE** | — |

Do not invent catalogue statistics.

## Source / candidate contracts (already in tree)

- Past dates filtered (I2 `offer-quality` / `tour-public-display`)
- Garbage partner copy hidden (I2)
- False-empty catalog pages typed unavailable (I1/I4 candidate, **not live**)
- Search no longer treats catalogue outage as empty (I5)

## Provider differences (contract, not live feed)

| Topic | Tripster | YouTravel | Native |
|-------|----------|-----------|--------|
| Currency | Partner payload | Partner payload | Platform listing |
| Dates | Schedule / slots | Partner dates | Availability slots |
| Images | Partner CDN | Partner CDN | Uploads |
| Organizer identity | Partner guide | Partner | `tours.owner_user_id` |
| Failure | Circuit + LKG | Same family | DB result types |

I5 does not force providers into one shape.

## Outlier rules (must run after data plane recovery)

Price = 0; extreme price; invalid currency; end < start; duration ≤ 0; past date as current; broken partner URL; duplicate external IDs; Iguazú mapped to Patagonia.

Until listings can be read, this scan is **blocked_external**, not a PASS.

## Search interaction (I5 new)

Production `/api/search` **500 empty body** because `fetchMarketplaceTours()` throws when deadline exceeds without LKG, and excursions were swallowed as `{ items: [] }` which then dropped all excursion hits.

That is a marketplace-quality defect in the **discovery** path, missed by I1–I4 page-level catalog work.
