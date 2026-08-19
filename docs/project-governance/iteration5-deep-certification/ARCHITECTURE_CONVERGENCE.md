# Architecture Convergence — Iteration 5 (Pass 5)

## Dependency / domain notes

Canonical graph: `docs/project-governance/DEPENDENCY_GRAPH.md`. I5 did not rewrite domains.

Dangerous coupling I5 touched: **search** imported marketplace + excursion catalogs and collapsed failures into empty sets. That is a hidden cross-domain write to the user-visible result list. Fix stays in the search module and uses typed availability.

## Flag interaction

| Combo | User actually gets |
|-------|-------------------|
| CMS cutover false + static overlay | Reviewed/static public HTML |
| `homepage_recommendations_v2` DB miss (fail → false) | Default home recommendations |
| Own payment `productionEnabled: false` | Checkout gate (S7/I4) |
| Dormant shop/forum + launch clamp | APIs quarantined / pages not in nav |
| Search catalog unavailable (I5) | Index hits kept + notice; not «no tours» |

No impossible state found that I5 could flip safely on production.

## Giant files (maintainability, not rewrite)

| Lines | File | Risk |
|------:|------|------|
| 5333 | `src/types/database.ts` | Generated types — leave |
| 2400 | `src/data/places-seed.ts` | Editorial seed — leave |
| 2270 | `OrganizerTourEditorView.tsx` | Real editor complexity |
| 1874 | `PageBuilderBlockFields.tsx` | Admin builder |
| 1530 | `ContentDocumentEditorView.tsx` | CMS |
| 1513 | `bookings-store.ts` | Booking SSOT in app |
| 1444 | `TourCheckoutModal.tsx` | Checkout |
| 1386 | `AuthModal.tsx` | Auth |

I5 does not split these. They are known concentration points for the next engineer.

## Duplicate logic

Price/date formatting still has more than one helper family (`FormattedPrice`, booking ledger, partner mappers). I2 aligned **bookable date** rules. I5 did not merge formatters (would be a wide UI rewrite).

Button/modal/card duplication exists; no additional merge this iteration.

## Cron truth

22 cron route files. 4 Vercel schedules. Others hang off `platform-maintenance` (daily 03:00 UTC) or `affiliate-sync`, or are manual. Docs that said «каждый час» were **wrong** (Hobby daily). I5 corrected `docs/trip-prep-e106.md` and `docs/messaging-v2-e97.md`.

`/api/cron/ops/health-report` and `/api/cron/ingestion` are not in the daily orchestrator — invoke-on-demand.

## Cleanup budget

- Dead routes: none deleted without dependency proof.
- Unused npm packages: not removed (risk vs value while production is down).
- Forum/shop code retained under quarantine.
- Command registry unchanged; golden path still `audit:quick` / `architecture:check` / `release:gate`.
