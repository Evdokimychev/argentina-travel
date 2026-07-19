# Data Migration Plan

## Mapping

- `config/sources.json` -> `ingestion_sources` with stable `legacy_key`.
- `database/import_state.json` -> `ingestion_sources.checkpoint`.
- `raw/**` and article JSON -> `ingestion_raw_documents` and `ingestion_candidates`.
- selected Markdown -> candidate processed content; publication remains a moderator action.
- export package CMS IDs -> candidate publication metadata when present.

## Guarantees

- Migration ledger key: `argentina-knowledge:<kind>:<legacy-id>`.
- Upsert by `legacy_key`, `(source_id, external_id)` and content hash.
- Dry run performs parsing, grouped counts, duplicate and orphan checks without mutation.
- Partial failure is recorded per record; rerun resumes safely.
- Secret values and Telegram sessions are never read into migration output.

## Verification

Compare source count, raw count, candidate statuses, checkpoints, fingerprints and orphan references. Store machine-readable evidence under `var/ops/argentina-knowledge-migration/`.
