# Implementation Progress

| Workstream | Status | Evidence |
|---|---|---|
| Repository safety and baseline | DONE | branches/dirty trees inspected; baseline 1850 tests |
| Inventory and target ADR | DONE | architecture, source inventory, feature matrix |
| Supabase schema/RLS/rollback | DONE | migration `20260719173719`; rollback SQL |
| Adapters | DONE | Telegram, website, RSS, sitemap, JSON, YouTube, manual |
| Pipeline/intelligence/dedupe | DONE | `src/lib/ingestion`, processing-step telemetry |
| Scheduler/retries/checkpoints | DONE | 15-minute cron, locks, cancel, backoff, dead letter, stuck detection |
| CMS/governance integration | DONE | draft target mapping, citations, update proposals |
| Admin module | DONE | overview, list/detail/preview, runs, moderation/duplicates, prompts |
| Permissions/audit/secrets | DONE | runtime allowlist and backend guards |
| Legacy migration dry-run | DONE | 3 sources, 22 raw, 2 candidates, 20 media |
| New-module lint/unit tests | DONE | ESLint clean; 5 files / 14 tests pass |
| Full project typecheck | VERIFYING | currently blocked by 3 concurrent `content-factory/server.ts` type errors outside ingestion |
| Full regression/build | VERIFYING | run after concurrent content-factory work stabilizes |
| Staging schema/data migration | BLOCKED EXTERNALLY | no staging project/Docker; local env points to production |
| Shadow verification | BLOCKED EXTERNALLY | requires staging credentials and Telegram/OpenAI secrets |
| Production cutover | BLOCKED EXTERNALLY | requires approved backup/staging evidence/operator |
| Decommission verification | BLOCKED EXTERNALLY | only after successful production shadow window |
