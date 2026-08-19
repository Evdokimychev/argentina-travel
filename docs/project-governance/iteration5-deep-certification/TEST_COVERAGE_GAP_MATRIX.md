# Test Coverage Gap Matrix — Iteration 5

Not a coverage-percentage chase. Capability → evidence → gap.

| Capability | Existing evidence | I5 added | Residual gap |
|------------|-------------------|----------|--------------|
| Public catalog truth | I1/I4 typed unavailable + page tests | Search availability unit + source contract | Live catalog still 503 |
| Search discovery | Index leak tests (I2 shop) | unavailable ≠ empty; CORE leak contract | No E2E dialog on production |
| Error disclosure | Provider log bounds (I4); transfers/experts `publicApiError` | `unexpectedPublicApiError` + CORE file contract | Dormant forum/shop still leak-shaped; unused |
| Organizer empty-on-error | I3 ownership | UI alert + no false onboarding | No component test; visual only |
| Booking writes | I4 integrity tests | GET/PATCH client errors sanitized | Live persist NOT_PROVEN |
| CMS CAS | I3 `expectedVersion` | none | Live two-editor NOT_PROVEN |
| Auth / RLS | Source grants last (I4) | none | Live RLS BLOCKED_EXTERNAL |
| Rate limit fail-closed | I4 `security_critical` | none | Upstash on Vercel unread |
| Marketplace outliers | I2 quality filters | documented blocked scan | Need live listing dump |
| Privacy processor | I4 partial | none | Daily cron only; live Auth 402 |
| Backup/restore | I4 blocked secrets | none | External |
| Browser journeys | I4 8 PASS / 5 FAIL / 8 BLOCKED | live curl sample | No new Playwright run this pass |
| Flaky tests | not re-run N times (cost) | targeted vitest green | Full suite once in `audit:quick` |

## False-positive watch

`public-runtime-error-boundary` originally used a naive `error.message` substring and would have failed on **server breadcrumbs**. I5 asserts the **client JSON** shape `{ error: error instanceof Error ? error.message` instead.

## High-risk still untested live

Money, publication, booking RPC, privacy deletion, RLS. Code tests exist; production effect does not.
