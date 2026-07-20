# Handoff

## Single operational system

- Product: Argentina Travel / Para Argentina.
- Admin: `/admin/ingestion`.
- Moderation and updates: `/admin/ingestion/moderation`.
- Scheduler: `.github/workflows/ingestion-dispatch.yml`, every 15 minutes.
- Protected endpoint: `/api/cron/ingestion`.
- Data: production Supabase `uooxrypocahomoqzdvzy`.
- Code: `main`, integrated from PR #13.

## Current evidence

- Schema: 107 journaled migrations; explicit Data API grants remain last.
- Migrated baseline: 3 sources, 22 raw documents, 2 candidates.
- Live state after cutover: 25 raw documents, 5 candidates, checkpoint message 785.
- Private archive: 20 media plus 101 other artifacts.
- Tests: 408 files / 1,942 tests; CI verify passed in 19m29s.
- Telegram: real adapter connection passed.
- Production runs: `6e0b4b7d-be8c-43e1-bb14-7261e38c683a` succeeded; replay `ade0f44d-716b-4f0b-b107-d3bab1b2557c` created 0 items.
- Dispatcher: GitHub workflow `29786205495` succeeded and wrote a durable cron row with HTTP 200.
- AI: optional; deterministic fallback is the current production path until Vercel billing verification.

The archived Python Collector is fail-closed and must not be restored while the native Telegram source is active. Operators manage source enablement, schedules, retries, moderation and publication only in Argentina Travel.
