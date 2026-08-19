# Final Independent Re-Audit — Iteration 5 (Pass F)

This pass pretends I5 fixes are unknown and asks: **where would a GO/CERTIFIED claim still be wrong?**

## Production vs candidate

| Check | Result |
|-------|--------|
| `origin/main` | `81055b1387e0062301ca9c0ae7468cbf782e2511` |
| Live `gitSha` | same |
| I5 branch | `cursor/iteration5-deep-certification-5475` (not production) |
| `/api/health` | 503 down |
| `/api/tours` `/api/excursions` | 503 |
| `/api/search?q=iguazu` | 500 empty body **on live SHA** |
| Vercel new deploy | Account blocked |
| Backup | secrets empty |

I5 code cannot change live numbers until deploy is possible.

## Re-run after I5 code

| Gate | Result |
|------|--------|
| Search availability unit tests | 3 cases PASS |
| Safe-error + CORE leak source contract | PASS |
| Targeted vitest (11) | PASS |
| Full `audit:quick` | recorded in final report after run |
| Live production smoke | still 503 / search 500 |
| Route census baseline vs I5 | 159 pages / 314 handlers — no route deleted |
| API security matrix | CORE unexpected JSON sanitized in candidate |
| Data anomaly scan | live listings unreadable |
| Public crawl sample | 12 informational 200s; visa 200; st_location 404; /search page 404 |
| Browser journeys | curl + source; no new Playwright claim |
| CMS/CRM/organizer persist | NOT_PROVEN |
| Marketplace quality live | NOT_SCANNABLE |

## Independent challenge

«If NOT CERTIFIED is wrong, the surprise would be: public HTML is good enough for launch.»

Checked: catalog APIs 503, search 500, Auth/REST 402, no backup, cannot deploy. HTML 200 is the I1–I4 trap. **NOT CERTIFIED stands.**

Second candidate: «I5 introduced a hidden 500 by changing search.» Mitigated by catching both catalogue slices and unit tests. Live cannot prove it until deploy.

Third candidate: «Error helper broke BookingCommandError 400s.» Booking POST still returns `error.message` only for `BookingCommandError` (controlled). Unexpected path uses `publicBookingError`.

## Detection gaps closed

| Missed by I1–I4 | Why | New detection |
|-----------------|-----|---------------|
| Search empty-as-outage | Audits stopped at `/tours` `/excursions` pages | `public-catalog-results` unavailable vs empty + search route contract |
| Client `error.message` | I4 scoped rate limits + provider logs | `unexpectedPublicApiError` + CORE source contract |
| Organizer empty list | I3 scoped ownership/RPC | UI alert; onboarding gated on load error |
| Hourly cron myth | Ops docs vs `vercel.json` | Corrected two docs + inventory cron map |
| AGENTS current pointer | Pointed at I1 report | Points at CURRENT_STATE / I5 |

## Residual detection gaps

Live RLS, persist E2E, listing outlier dump, backup restore, Vercel deploy, Auth session matrix — still external.
