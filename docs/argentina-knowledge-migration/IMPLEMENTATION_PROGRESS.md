# Implementation Progress

| Workstream | Status | Evidence |
|---|---|---|
| Baseline and repository safety | DONE | clean baseline: typecheck/lint/1850 tests |
| Inventory and target ADR | IN PROGRESS | migration dossier |
| Supabase ingestion schema/RLS | TODO | pending migration |
| Server adapters and pipeline | TODO | pending `src/lib/ingestion` |
| Jobs, locks, retries, checkpoints | TODO | pending cron/admin APIs |
| Admin sources/runs/moderation | TODO | pending admin module |
| Legacy migration dry run | TODO | pending migration script |
| Shadow verification | TODO | requires migrated DB and credentials |
| Production cutover | BLOCKED EXTERNALLY | production credentials/deployment required |
| Decommission verification | BLOCKED EXTERNALLY | after production shadow window |
