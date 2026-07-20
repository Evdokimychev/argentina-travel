# Implementation Progress

Cutover date: 2026-07-20. Target: production Supabase `uooxrypocahomoqzdvzy` and `goargentina.ru`.

| Workstream | Status | Evidence |
|---|---|---|
| Inventory and target architecture | DONE | architecture, source inventory, feature matrix, ADR |
| Native schema, RLS and rollback | DONE | 105 journaled migrations; latest explicit Data API grants `20260720222912` |
| Telegram, web, RSS/Atom, JSON, sitemap, YouTube, manual | DONE | shared adapters and admin source registry |
| Full-text/captions/checkpoints | DONE | bounded backlog, YouTube captions, RSS full text |
| Pipeline, retry, dedupe and telemetry | DONE | checkpoint-on-success, retryable raw rows, full exact/near scan |
| CMS and media integration | DONE | draft-only publication, citations, public media promotion |
| Existing-page proposals | DONE | explicit accept/reject and atomic version-checked apply |
| Admin ingestion module | DONE | sources, runs, moderation, provenance, proposals, prompts |
| Secrets and scheduler | DONE | Vercel encrypted Telegram vars; GitHub dispatcher every 15 minutes |
| Production schema migration | DONE | two feature migrations plus final explicit-grants migration applied |
| Production data migration | DONE | 3 sources, 22 raw, 2 candidates, 20 media, 101 artifacts |
| Idempotency/checksum verification | DONE | second apply created 0 candidates; 123 checksums verified again |
| Regression and production build | DONE | 408 files / 1,942 tests; typecheck/build/audit PASS |
| Backup and legacy archive | DONE | encrypted DB dump and full 8,104-entry Collector archive |
| Production deployment and smoke | DONE | deployment `dpl_2LwK3EEmVJ6ReQKb5dFwqen1P7zW`; health/schema/auth guards and public smoke PASS |
| Live Telegram cutover | DONE | first run processed 3 items; second checkpoint run processed 0 |
| Legacy runtime decommission | DONE | fail-closed entrypoint plus `DECOMMISSIONED.md`; encrypted rollback archive retained |

AI enrichment is optional. Vercel AI Gateway authentication is configured through OIDC, but inference currently requires account billing verification. Deterministic scoring, dedupe, ingestion and moderation remain operational without AI.
