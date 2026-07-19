/**
 * Machine-readable release blocker. The current production RLS still permits
 * anon/authenticated INSERT into analytics_events. Do not treat the table as a
 * trusted KPI source until a rehearsed migration revokes those grants/policies.
 */
export const ANALYTICS_INGESTION_SECURITY = {
  trustedForKpi: false,
  status: "blocked_pending_migration_history_normalization",
  requiredControls: [
    "revoke INSERT on public.analytics_events from anon and authenticated",
    "drop analytics_events_anon_insert policy",
    "grant INSERT to service_role only",
    "validate event allowlist and flat PII-free payload in server ingestion",
  ],
} as const;
