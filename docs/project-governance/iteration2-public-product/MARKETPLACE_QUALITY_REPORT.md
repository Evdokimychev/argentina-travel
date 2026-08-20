# Iteration 2 — marketplace quality

## Providers in code

| Source | Role | Freshness policy | Public decision |
|--------|------|------------------|-----------------|
| Platform / CMS tours | Native listings | REST + 5 min catalog cache | Past-only dates now hidden even without partner gate |
| Tripster | Excursions + partner tours | Partner sync + catalog revalidate 300s | `evaluateOfferQuality` + description sanitizer |
| YouTravel | Multi-day tours | Offer mapper + future-date filter | Same quality gate + card text sanitizer |
| Sputnik8 | Excursion partner | Existing verify/sync scripts | Unchanged this iteration; no fake availability added |

## Dates

Root cause of the June/July 2026 homepage cards was **not** a single hardcoded seed. The display path used `availableDates[0]` and the bookable filter skipped **platform** listings. A nightly/cached partner snapshot can therefore show the first date even when it is already past.

Fix (systemic):

1. `filterBookableMarketplaceListings` drops any listing whose known dates are all in the past (Argentina timezone).
2. Remaining dates are `filterFutureTourDates`.
3. `resolveTourCardScheduleDisplay` and list-card/modal re-check `isFutureOrTodayYmd`.
4. Regression tests cover 26–27 June 2026 vs 19 August 2026.

`NO_BOOKABLE_DEPARTURE` (unknown schedule) stays discoverable as degraded, **not** as a fake date.

## Partner text

Observed defect class: machine-translated nonsense such as «Откройте для себя потрясающую аргентинскую сторону на сковороде».

Quality layer now flags:

- known nonsense phrases and cooking utensils in travel context;
- mojibake / entity garbage / script;
- repeated marketing templates;
- language-suspect Latin-only long copy.

Public card text is hidden when garbage is detected. No invented destination substitute.

## Freshness / degraded model

| State | Meaning | UI |
|-------|---------|----|
| LIVE | Future date or honest no-schedule + fresh feed | Bookable / degraded card |
| STALE_BUT_SAFE | Feed stale but dates still future | Existing `STALE_SOURCE` → degraded |
| DEGRADED | Missing schedule or soft quality issues | Card without fake dates |
| UNAVAILABLE | Past-only, sold out, invalid price, quota | Hidden from bookable catalog or catalog unavailable |

Production 2026-08-19: catalog sources are **UNAVAILABLE** (health 503 / REST 402). Homepage does not invent cards. Last-known-good is re-filtered before reuse.

## BLOCKED_EXTERNAL

Live price/date/availability proof on www cannot be completed until Iteration 1 data-plane blockers are cleared. Unit/regression proof is in-repo.
