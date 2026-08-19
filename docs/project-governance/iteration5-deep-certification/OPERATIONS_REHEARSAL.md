# Operations Rehearsal — Iteration 5 (Pass 7)

Dry-run against **current production**, not a hoped-for healthy day.

## Morning operations

Admin opens `/admin` → 307 login. Auth Data API is **402**. Operator cannot see provider failures, CMS drafts, or leads from the live cabinet.

What they *can* see without login: public `/api/health` 503 with `dependency_unavailable`, SHA `81055b13`, migration metadata `20260811040455_final_explicit_data_api_grants` (109 files in health payload; repo candidate has later grants file).

I3/I4 operations queue is **candidate-only**.

## Editorial day

Create/publish/slug/image: blocked on CMS persist + ISR. Unpublish helper exists in candidate (I3), not live.

## Marketplace incident

Provider bad data: operator cannot open partner health if admin session cannot be established. Public `/api/tours` already 503 — blast radius is «no catalog», not «wrong Iguazú in Patagonia» on live SHA.

I5 search fix prevents a second lie: «search says there are no excursions» during the same outage.

## User complaint: «заявка не дошла»

Need: request id, `bookings` row, cron/email, organizer inbox. Live DB reads are unavailable. Support cannot prove delivery today. Runbook remains `docs/ops/incident-runbook.md` + `RELEASE_RUNBOOK.md`.

## Release incident

1. SHA: `/api/health` → `gitSha`.
2. Rollback: Vercel **Account is blocked** — cannot deploy rollback or I5.
3. Recovery check: blocked.

## DB incident

Health names source `POSTGRES_URL_NON_POOLING`, ref `uooxrypocahomoqzdvzy`, IPv6-only ENETUNREACH + REST 402. Runbook is accurate; owner actions are external.

## Security incident (leaked secret)

Identify → revoke in Supabase/Vercel/GitHub → rotate → redeploy → audit. Redeploy is currently **impossible** (Vercel blocked). Documented in I4; I5 reconfirms.

## Backup failure

GitHub `production-backup` secrets empty (I4). A failed job is not pageable to a restore. I5 did not fake a backup.

## Cron reality

Daily 03:00 UTC orchestrator only. Booking 24h reminders and CMS scheduled publish have **up to ~24h** latency on Hobby. Docs that claimed hourly were corrected.
