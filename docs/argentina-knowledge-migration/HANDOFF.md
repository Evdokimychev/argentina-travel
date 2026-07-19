# Handoff

## Operational state

- Target code is in Argentina Travel branch `codex/sprint-0-release-candidate` with a dirty worktree containing unrelated concurrent changes; do not revert them.
- New schema migration: `supabase/migrations/20260719173719_argentina_knowledge_native_ingestion.sql`.
- Rollback: `supabase/rollback/20260719173719_argentina_knowledge_native_ingestion.sql`.
- Admin entry: `/admin/ingestion`.
- Scheduler: `/api/cron/ingestion`, every 15 minutes in `vercel.json`.
- Migration dry-run: `npm run kb:migrate-collector:dry`.

## Safety boundary

`.env.local` points to canonical production Supabase `uooxrypocahomoqzdvzy`. Do not run schema/data writes until a distinct staging target is configured and verified. Docker/local Supabase is unavailable in the current environment.

## Required next operator actions

1. Provision staging and set staging `DATABASE_URL`, Supabase keys, `CRON_SECRET`, `ARGENTINA_TELEGRAM_*` and optional OpenAI variables.
2. Apply migrations through `npm run supabase:migrate` with `MIGRATION_TARGET_ENVIRONMENT=staging`.
3. Run migration dry/apply/apply and save count/checksum evidence.
4. Complete the staging scenarios in `TEST_REPORT.md` and shadow comparison in `CUTOVER_PLAN.md`.
5. Use the canonical production confirmation gate only after backup/restore and staging acceptance pass.

Never publish an imported candidate automatically, expose raw storage publicly, or run old and new collectors for the same source simultaneously.
