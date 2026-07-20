# Test Report

## Final verification, 2026-07-20

| Check | Result |
|---|---|
| TypeScript `tsc --noEmit` | PASS |
| ESLint | PASS with pre-existing repository warnings only |
| Full Vitest | PASS: 408 files / 1,942 tests |
| Targeted ingestion rerun | PASS: 5 files / 18 tests |
| Production Next.js build | PASS: 828 static pages generated |
| Dependency audit | PASS: 0 vulnerabilities |
| Static RLS audit | PASS: 153 tables, no critical issues |
| Migration journal | PASS: 105 rows, latest `20260720222912` explicit grants |
| Real Telegram adapter | PASS: authorized connection, 1,823 ms |
| Migration apply | PASS: 3/22/2/20/101 |
| Second migration apply | PASS: 0 new candidates, all checksums repeated |
| Storage verification | PASS: 121 objects / 4,436,530 bytes |
| Collector archive listing | PASS: 8,104 entries, required secrets/Git/data present |
| Production deployment/smoke | PASS: schema 105, direct Postgres, public pages and guarded routes |
| Live Telegram run | PASS: 3 fetched / 3 normalized / 1 moderation / 0 failed |
| Checkpoint replay | PASS: 0 fetched / 0 stored / 0 candidates / 0 failed |

The Supabase CLI hosted advisor endpoint could not be used because the logged-in account lacks that platform endpoint privilege. This did not block the migration: the project runner applied both SQL files transactionally, the canonical checksum journal verified them, direct SQL evidence matched, and the repository RLS audit passed.

## Expected guarded behavior

- Imported material never publishes automatically.
- Existing pages can change only after a human accepts a proposal and the CMS row version still matches.
- Raw media remains private; publication copies reviewed images into CMS storage.
- Telegram/RSS/YouTube failures preserve checkpoints so items are retried.
- AI failure adds a flag and leaves deterministic processing available.
