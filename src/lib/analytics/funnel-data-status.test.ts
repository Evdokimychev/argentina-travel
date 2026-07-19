import { describe, expect, it } from "vitest";
import { resolveAnalyticsFunnelTrust } from "@/lib/analytics/funnel-data-status";

describe("admin funnel data quality", () => {
  it("fails closed instead of presenting estimates or untrusted events as conversion", () => {
    expect(
      resolveAnalyticsFunnelTrust({
        hasObservedTourViews: true,
        ingestionTrusted: false,
      }),
    ).toMatchObject({
      dataStatus: "untrusted_direct_insert",
      trustedForKpi: false,
    });

    expect(
      resolveAnalyticsFunnelTrust({
        hasObservedTourViews: false,
        ingestionTrusted: true,
      }),
    ).toMatchObject({ dataStatus: "unavailable", trustedForKpi: false });

    expect(
      resolveAnalyticsFunnelTrust({
        hasObservedTourViews: true,
        ingestionTrusted: true,
      }),
    ).toEqual({ dataStatus: "trusted", trustedForKpi: true, reason: null });
  });
});
