# Cutover Plan

## Preconditions

- Verified staging project and environment fingerprint distinct from production.
- Database backup plus restore rehearsal.
- Migration applied and migration script run twice successfully.
- Telegram credential reference tested in the new admin; OpenAI optional path tested.
- Named operator, rollback owner and observation window.

## Phase 1: shadow

1. Keep migrated sources paused, test each connection, then enable only in staging/shadow.
2. Run at least two complete source cycles with CMS publication disabled by process.
3. Compare source counts, external IDs, raw hashes, duplicates, failures, latency and checkpoints with the Collector.
4. Acceptance: no unexplained misses/duplicates, no stuck runs, checkpoint delta zero, all errors categorized.

## Phase 2: old system read-only

1. Create final Collector filesystem/Git backup and checksum manifest.
2. Prevent new source/config changes in Collector.
3. Stop its manual/operator collection window only after the new scheduler is ready.

## Phase 3: Argentina Travel primary

1. Apply `20260719173719_argentina_knowledge_native_ingestion.sql` through the canonical migration journal.
2. Run `npm run kb:migrate-collector`, verify counts, then test/enable real sources.
3. Confirm `/api/cron/ingestion` heartbeat and no old process is collecting.
4. Observe two additional cycles before decommission approval.

## Rollback trigger and procedure

Trigger on unexplained data loss, checkpoint regression, repeated credential failure, duplicate storm or inability to moderate. Disable new sources first; record current checkpoints and runs; stop new cron; re-enable exactly one old Collector operator path from the backup checkpoint; never run both schedulers. New raw rows remain retained. CMS drafts/update proposals created after cutover are reviewed individually and are not deleted automatically.

Recommended rollback window: 14 days after primary cutover. Owner: production operator designated in the change record.
