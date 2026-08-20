# API Security Matrix — Iteration 7 (partial autonomous pass)

Live role-matrix against production DB: **BLOCKED_EXTERNAL**.

## Static / code pass completed

| Check | Result |
|-------|--------|
| Unexpected `error.message` on forum/shop | Fixed → `unexpectedPublicApiError` |
| Organizer commission unexpected | Fixed |
| Booking create/patch unexpected | Client uses publicBookingError (breadcrumb may log message) |
| Password reset client payload | Safe allowlisted messages |
| Stripe checkout unexpected | `publicApiError(PAYMENT_PROCESSING_FAILED)` |
| Dormant module quarantine | Tests present for /forum /shop |

## Remaining (needs live credentials)

| Check | Status |
|-------|--------|
| Anon / auth / organizer A/B / staff / admin matrix | NOT_RUN live |
| IDOR foreign booking/tour IDs | NOT_RUN live |
| Service-role census least-privilege review | Partial (source exists; live attest blocked) |
| Rate-limit fail-closed under Upstash outage | Covered by unit tests historically |

## Cron authorized responses

Cron routes may still include Error.message in JSON for operator debugging under `CRON_SECRET`. Prefer generic messages in a follow-up; not launch-blocking vs public CORE leaks.
