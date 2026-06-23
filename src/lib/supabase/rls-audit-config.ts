/** Public tables that may have RLS enabled without any policies (service role only). */
export const SERVICE_ROLE_ONLY_TABLES = [
  "api_key_usage_log",
  "affiliate_link_clicks",
  "booking_commission_snapshots",
  "payment_audit_log",
  "payment_transactions",
  "payout_records",
  "platform_commission_rules",
  "sputnik8_booking_requests",
  "sputnik8_sync_runs",
  "trip_prep_reminders_sent",
  "tripster_booking_requests",
  "tripster_sync_runs",
  "url_redirects",
  "youtravel_booking_requests",
  "youtravel_sync_runs",
] as const;

export type ServiceRoleOnlyTable = (typeof SERVICE_ROLE_ONLY_TABLES)[number];

export function isServiceRoleOnlyTable(table: string): boolean {
  return (SERVICE_ROLE_ONLY_TABLES as readonly string[]).includes(table);
}
