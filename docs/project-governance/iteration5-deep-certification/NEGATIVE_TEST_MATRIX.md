# Negative / Adversarial Test Matrix — Iteration 5 (Pass C)

Live base: `https://www.goargentina.ru` SHA `81055b13`. Candidate contracts are source + unit tests.

| ID | Case | Live result | Candidate | Severity |
|----|------|-------------|-----------|----------|
| N-01 | `POST /api/contact` malformed JSON | 400 `Некорректный JSON.` no stack/SQL | keep | pass |
| N-02 | `POST /api/contact` HTML name + bad email | 400 `Проверьте формат email.` | keep | pass |
| N-03 | `POST /api/newsletter` `{}` | 400 `Укажите email.` | keep | pass |
| N-04 | `POST /api/newsletter` invalid JSON (`"a"*500+"@x.com"` raw) | 400 invalid JSON | keep | pass |
| N-05 | `GET /api/search?q=` + `q=iguazu` | **500 empty body** | catch catalogue; 200 + `catalog.*.unavailable` | **P1** |
| N-06 | `GET /api/search?q=` 250×`я` | 400 too long | keep | pass |
| N-07 | `GET /TOURS` | 404 | accepted | P3 |
| N-08 | `GET /tours/` | 308 `/tours` | keep | pass |
| N-09 | `GET //tours` | 308 `/tours` | keep | pass |
| N-10 | `GET /places/USHUAIA` | 200 same place | accepted Next behavior | P3 |
| N-11 | `GET /admin` unauthenticated | 307 sign-in | keep | pass |
| N-12 | `GET /organizer` unauthenticated | 307 sign-in | keep | pass |
| N-13 | `GET /api/contact` | 405 | keep | pass |
| N-14 | Search chrome on API 500 | Silent static fallback | Visible notice | **P1** |
| N-15 | Organizer bookings fetch fail | Empty list / onboarding | Alert, keep last list | **P1** |
| N-16 | CORE `error.message` on 500 | Present on old SHA | `unexpectedPublicApiError()` | **P1** |
| N-17 | Forum/shop unexpected 2xx | Not re-opened; I4/S7 quarantine remains | no change | residual dormant |
| N-18 | CMS two editors | `expectedVersion` CAS (I3) | keep | not live-proven |
| N-19 | Delete entity with deps | Not mutated in I5 (no live DB) | BLOCKED_EXTERNAL | — |
| N-20 | Auth expired / two tabs | Not executable without healthy Auth (402) | BLOCKED_EXTERNAL | — |

## API auth matrix (source)

Protected families (`/api/admin/*`, `/api/organizer/*`, `/api/bookings`, privacy, conversations) still go through `authorizeAdminRequest` / session role / `userHasAccountRole`. I5 did not find a hidden unauthenticated write on CORE after source review. Live role matrix: **NOT_PROVEN** (Auth 402).

## Error disclosure

I5 sanitized unexpected catch payloads on CORE public, auth, booking, organizer, conversations, map, privacy, favorites, blog comments, experts, group-trips, and selected admin list/update routes.

Left as-is (known domain or dormant):

- Forum / shop (quarantined modules)
- Some ingestion 400/409 paths that map custom errors
- Cron responses (secret-gated)
- Server breadcrumbs still log `error.message` (not client-visible)

Regression test: `src/lib/public-api/public-runtime-error-boundary.test.ts`.
