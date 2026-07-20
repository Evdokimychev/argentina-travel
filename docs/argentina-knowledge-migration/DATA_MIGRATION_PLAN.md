# Data Migration Plan

Status: `DONE` on 2026-07-20.

| Legacy | Target | Identity / result |
|---|---|---|
| `config/sources.json` | `ingestion_sources` | 3 disabled migration records, keyed by `legacy_key` |
| Telegram articles/messages | `ingestion_raw_documents` | 22 rows by source/external ID/content hash |
| Publishable articles | normalized documents and candidates | 2 moderation candidates |
| Non-publishable/test rows | raw archive and ledger | 20 retained as skipped, not lost |
| `media/` | private `ingestion-raw` | 20 files / 4,338,870 bytes |
| `raw`, `knowledge`, `exports`, `config` | private Storage archive | 101 files / 97,660 bytes |
| Migration evidence | `ingestion_migration_ledger` | migration-scoped four-part unique identity |

Production apply used the explicit guard:

```bash
npx tsx scripts/migrate-argentina-knowledge.ts \
  --apply \
  --allow-production \
  --confirm=uooxrypocahomoqzdvzy:argentina-knowledge-native-v1
```

The command was run twice. Both runs verified 2 article, 20 media and 101 artifact checksums. The second run created zero new candidates. Storage-safe ASCII keys are deterministic; original Unicode paths remain unchanged in the ledger.

After cutover, production run `6e0b4b7d-be8c-43e1-bb14-7261e38c683a` advanced the Telegram checkpoint to message 785 and added 3 raw documents. Forced replay `ade0f44d-716b-4f0b-b107-d3bab1b2557c` fetched and created zero rows. The live totals are 25 raw documents and 5 candidates; the original migrated baseline remains 22 and 2 respectively.
