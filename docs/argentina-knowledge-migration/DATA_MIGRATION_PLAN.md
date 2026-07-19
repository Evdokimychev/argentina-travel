# Data Migration Plan

## Mapping

| Legacy | Target | Identity |
|---|---|---|
| `config/sources.json` | `ingestion_sources` | `legacy_key` |
| Telegram messages/articles | `ingestion_raw_documents` | source + external ID + content hash |
| Content-bearing articles | `ingestion_normalized_documents`, `ingestion_candidates` | raw ID / normalized ID |
| Local media | private Storage bucket `ingestion-raw` | SHA-256 + legacy relative path |
| Editorial metadata | candidate score/reasons/flags | legacy identity |
| Migration state | `ingestion_migration_ledger` | source system + entity type + legacy ID |

## Commands

```bash
npm run kb:migrate-collector:dry
npm run kb:migrate-collector
```

`kb:migrate-collector` is allowed only after the new migration has been applied to staging and environment variables point to staging. It must not be run with the current production `.env.local` during development.

## Dry-run result, 2026-07-19

- Sources discovered: 3.
- Canonical raw documents: 22.
- Valid moderation candidates: 2.
- Raw-only/skipped candidates: 20.
- Media: 20 files / 4,338,870 bytes.
- Script performed no writes and emitted SHA-256 inventory.

## Verification queries

Compare ledger grouped counts, orphan raw/normalized/candidate references, unique source/external/hash identities, source checkpoints, media checksums and run counts. A second `--apply` must migrate zero new candidates and verify existing checksums.
