import { describe, expect, it } from "vitest";
import { ANALYTICS_INGESTION_SECURITY } from "@/lib/analytics/ingestion-security";

describe("analytics ingestion security status", () => {
  it("keeps direct Data API ingestion visible as a release blocker", () => {
    expect(ANALYTICS_INGESTION_SECURITY.trustedForKpi).toBe(false);
    expect(ANALYTICS_INGESTION_SECURITY.requiredControls).toContain(
      "revoke INSERT on public.analytics_events from anon and authenticated",
    );
  });
});
