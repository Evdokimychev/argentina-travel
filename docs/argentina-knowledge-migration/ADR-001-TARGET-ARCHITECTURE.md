# ADR-001: Target Ingestion Architecture

Status: Accepted, 2026-07-19.

## Decision

Argentina Travel owns one operational source registry, ingestion pipeline, moderation queue, publication workflow and audit trail in its existing Next.js/Supabase architecture.

Adapters implement `validateConfig`, `testConnection`, `fetch`, `parse`, `normalize`, `checkpoint` and `healthCheck`. Every fetched item is stored as an immutable raw document, normalized into a candidate, scored/deduplicated, then held for human moderation. Publishing reuses `content_documents`, revisions, governance and search indexing.

Supabase stores durable source/run/document/candidate/step state. Route handlers perform short, bounded work; cron dispatches due sources. A unique active-run constraint prevents concurrent processing of the same source. Heavier future browser/embedding workers may run separately, but remain in this repository and are controlled through the same DB/admin plane.

`content_sources` remains the citation/evidence registry. Operational `ingestion_sources` links into it when a candidate becomes a CMS source, avoiding semantic overload and duplicate publication truth.

## Consequences

- No runtime request from Argentina Travel to the old Collector.
- No secrets in source rows; only deployment secret references.
- No automatic publication from ingestion or AI.
- Transitional package API and Python exporter become migration/rollback tools only.
- Production decommission waits for shadow evidence and rollback readiness.
