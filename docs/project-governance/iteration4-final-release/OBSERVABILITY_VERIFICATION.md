# Observability verification — Iteration 4

## Health

Live `GET https://www.goargentina.ru/api/health` 2026-08-19T04:37:10Z:

- HTTP 503, `ok: false`, `status: down`
- `gitSha`: `81055b1387e0062301ca9c0ae7468cbf782e2511`
- `environment.nodeEnv`: production, `deployEnv`: production
- DB: required, not skipped, 75ms, `dependency_unavailable`
- Direct PG: required, 23ms, `dependency_unavailable`
- Connection attestation (no secrets): `POSTGRES_URL_NON_POOLING` / `supabase_direct` / 5432 / ref `uooxrypocahomoqzdvzy` / `verified`
- Search index: optional, unavailable
- Migration metadata in health: `20260811040455_final_explicit_data_api_grants` / 109 files — **production artifact**, not I4 candidate (111 / `20260819120000_…`)

Health is a probe, not a full audit. That contract is intact.

## Release SHA

Diagnostic surface exposes git SHA and deploy env without secrets. Matches
`origin/main`. I4 RC SHA is **not** on production.

## Sentry

- Code: `sendDefaultPii` disabled, `scrubMonitoringData` on extras/breadcrumbs.
- Live event intake / source maps / release binding: **BLOCKED_EXTERNAL** (no
  Sentry project access in this agent). Controlled test error was not fired
  into production.

## Logging

- Partner logs remain allowlisted (Sprint 6 / I1 lineage).
- Rate-limit Upstash errors log once per process.
- No secret values written into I4 evidence.

## Cron observability

- `logCronResult` retained on critical crons.
- Live last-run rows: BLOCKED_EXTERNAL (DB down).
- Unauthorized cron: 401 without secret.

## Partner health

`GET /api/health/partners` 503: tripster / youtravel / sputnik8 all `down`,
counts and last sync null, freshness unknown. Admin panel exists in I3
candidate; not on live SHA.

## Alertability (what actually needs a human)

1. Health 503 / DB down — **firing now**.
2. Backup workflow failure — **firing now** (empty secrets).
3. Vercel account blocked — **firing now**.
4. Persistent catalog 5xx — **firing now**.
5. Marketplace sync dead — implied by partner health down.
6. Do **not** alert on ordinary 404.

## PII

Health/partner JSON in this probe contained no emails, phones, tokens, or
auth headers.
