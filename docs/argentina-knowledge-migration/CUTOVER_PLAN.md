# Cutover Plan

1. Apply schema in staging and run migration dry-run.
2. Migrate sources, raw documents, candidates and checkpoints.
3. Run new ingestion in shadow mode with publication disabled.
4. Compare two full cycles: counts, failures, duplicates, latency and checkpoints.
5. Freeze source editing and scheduler in old Collector.
6. Enable Argentina Travel scheduler as sole ingestion owner.
7. Observe two more cycles and reconcile every discrepancy.
8. Revoke temporary M2M key, keep rollback credentials during the retention window.
9. Mark old repository read-only and archive its backup.

Cutover is not authorized by code completion alone; it requires production evidence and an identified operator.
