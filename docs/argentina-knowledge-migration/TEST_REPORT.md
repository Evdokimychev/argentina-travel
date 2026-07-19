# Test Report

## Baseline before migration

- `npm run audit:quick`: PASS.
- TypeScript and ESLint: PASS with pre-existing warnings.
- Unit/integration: 387 files / 1850 tests PASS.
- Argentina Knowledge: 13 tests and 4 checks PASS in the previous wave.

## Native ingestion verification

| Check | Result |
|---|---|
| Targeted ESLint for ingestion/API/admin/migration | PASS, no output |
| `vitest run src/lib/ingestion` | PASS, 5 files / 14 tests |
| Content intelligence | PASS: normalize, location/category, score, fingerprint, similarity |
| Scheduling | PASS: interval, Argentina timezone cron, disabled/manual |
| Secret/config validation | PASS: nested secret rejection and allowlist |
| SSRF guard | PASS: localhost, URL credentials and file protocol blocked |
| Architecture contract | PASS: private RLS/storage, draft-only CMS, migration ledger |
| Migration dry-run | PASS: 3/22/2/20 inventory, no writes |
| Supabase local lint | BLOCKED EXTERNALLY: Docker daemon unavailable |
| Staging integration/E2E | BLOCKED EXTERNALLY: staging target unavailable |

## Current full-project signal

The latest full TypeScript run reached three errors in concurrently modified `src/lib/content-factory/server.ts`: new required content-factory fields are not mapped. No ingestion TypeScript errors were reported. These errors must be cleared before claiming a production build. They are not suppressed or excluded.

## Required staging scenarios

1. Create and test manual/RSS/Telegram sources, then activate.
2. Run twice and prove raw/candidate idempotency and checkpoint movement.
3. Mock/execute OpenAI success, fallback, 429 and unavailable paths.
4. Approve a new candidate and verify a no-index CMS draft plus citation.
5. Resolve a duplicate and prepare an existing-page update proposal without changing public content.
6. Run migration twice and compare counts/checksums/orphans.
