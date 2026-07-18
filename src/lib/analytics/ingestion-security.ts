/**
 * Machine-readable contract for the controlled analytics ingestion migration.
 */
export const ANALYTICS_INGESTION_SECURITY = {
  trustedForKpi: true,
  status: "controlled_server_ingestion",
  requiredControls: [
    "revoke INSERT on public.analytics_events from anon and authenticated",
    "drop analytics_events_anon_insert policy",
    "grant INSERT to service_role only",
    "validate event allowlist and flat PII-free payload in server ingestion",
    "mark historical rows legacy_unverified and query KPI from controlled_server only",
  ],
} as const;
