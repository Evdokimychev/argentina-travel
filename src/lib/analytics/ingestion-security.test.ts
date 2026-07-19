import { describe, expect, it } from "vitest";
import { ANALYTICS_INGESTION_SECURITY } from "@/lib/analytics/ingestion-security";

describe("analytics ingestion security status", () => {
  it("trusts KPI only after direct Data API ingestion is revoked", () => {
    expect(ANALYTICS_INGESTION_SECURITY.trustedForKpi).toBe(true);
    expect(ANALYTICS_INGESTION_SECURITY.status).toBe("controlled_server_ingestion");
    expect(ANALYTICS_INGESTION_SECURITY.requiredControls).toContain(
      "revoke INSERT on public.analytics_events from anon and authenticated",
    );
    expect(ANALYTICS_INGESTION_SECURITY.requiredControls).toContain(
      "mark historical rows legacy_unverified and query KPI from controlled_server only",
    );
  });
});
