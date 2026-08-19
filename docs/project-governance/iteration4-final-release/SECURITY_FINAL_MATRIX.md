# Security final matrix — Iteration 4

Live RLS/IDOR against production Data API: **BLOCKED_EXTERNAL** (402 quota).
Cells below are **source + unit contracts** unless marked live.

## Role matrix (critical cells)

| Action | Anonymous | User | Organizer | Staff | Admin |
|--------|-----------|------|-----------|-------|-------|
| Read public HTML | allow | allow | allow | allow | allow |
| Catalog Data API while DB down | 503 fail-closed (live) | same | same | same | same |
| POST `/api/contact` | rate-limited; persist BLOCKED | same | same | n/a | n/a |
| POST `/api/organizer-applications` | auth + fail-closed limiter | own insert | own | RPC only | RPC only |
| Organizer tour draft by foreign id | n/a | 404 contract | 404 foreign | staff path | staff path |
| Admin `/admin` HTML | 307 sign-in (live) | 307 unless staff | 307 unless staff | allow if role | allow |
| Lead status PATCH | deny | deny | deny | transition matrix | transition + audit |
| Own payment checkout | gated off | gated off | gated off | gated off | gated off |
| Cron invoke without bearer | 401 | 401 | 401 | 401 | 401 |
| Partner image fetch to localhost/metadata | deny allowlist | deny | deny | deny | deny |

## Authentication

- Login/logout/reset exist; live session drill **BLOCKED_EXTERNAL**.
- Password reset and phone/email lookup use `checkSecurityRateLimit` / `policy: "security_critical"`.
- Cookies come from `@supabase/ssr` (HttpOnly/Secure/SameSite via library defaults). Live Set-Cookie flags not re-dumped (would include session material).
- Open redirect: admin/organizer gates stay on same origin `?auth=sign-in&next=…`.
- Expired/revoked/suspended users: not live-proven.

## Authorization / IDOR

- I3: organizer ownership from `tours.owner_user_id`; foreign/missing draft 404.
- I3: contact `organizer_application` → 400 `USE_ORGANIZER_APPLICATIONS`.
- Staff cannot UPDATE `organizer_applications` except via RPC (migration + grants restatement).
- UI hide is not treated as authorization.

## CSRF / Origin

- Sprint 6 `evaluateBrowserMutationOrigin` retained for admin session mutations.
- SameSite=Lax session cookies. Live CSRF browser drill BLOCKED_EXTERNAL.

## SSRF / XSS / SQLi

- Partner image proxy: HTTPS allowlist, no credentials, no IP/localhost, manual redirects revalidated. Not weakened.
- CMS/partner HTML: existing sanitizers retained. No new unsanitized HTML renderer.
- Search/filters use parameterized / typed builders. No new raw SQL.

## Uploads

- Existing MIME/size/path checks retained. No I4 upload feature.

## Rate limits

- Upstash unset → in-memory (dev / single instance). **Not production-global.**
- Upstash error + `security_critical` → fail-closed 429.
- Applied to auth, bookings, contact, newsletter, organizer applications, waitlist, partner booking, shop orders.
- Forum/shop public APIs remain launch-quarantined.

## Webhooks / cron

- Payment webhooks: signature + idempotency from earlier sprints; own payment still off.
- Every `/api/cron/*` uses `authorizeCronRequest` (timing-safe bearer). Secret not placed in query string.

## Secrets

- Current-tree scan: one `BEGIN PRIVATE KEY` **string check** in `search-provider-clients.ts` (validator, not a key).
- No service-role JWT, Stripe live key, or PEM committed.
- History-wide gitleaks not installed in this agent. Residual history risk: accepted, not claimed clean-forever.

## Dependencies

- `npm audit --omit=dev`: 0 production vulnerabilities on 2026-08-19.
- No major platform upgrade performed.

## Headers (live www)

Present: HSTS, XFO SAMEORIGIN, nosniff, Referrer-Policy, Permissions-Policy.
CSP: **not shipped**. Introducing a blocking CSP on launch day was rejected.

## Privacy

- Sentry `sendDefaultPii` disabled; `scrubMonitoringData` on extras.
- Analytics params sanitized; consent required before YM/GTM.
- Backup manifest forbids emails/phones/connection strings.

## P0/P1 security leftovers

- Live RLS/grants on canonical ref: BLOCKED_EXTERNAL (not a code skip).
- Distributed limiter requires Upstash in production. Presence on Vercel **not readable** here.
- CSP absent: P2/accepted risk, not launch-blocking by itself.
