import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { fetchAdminFunnels } from "@/lib/admin/funnels-server";

function client(responses: Record<string, { data: unknown; error: unknown }>) {
  return {
    rpc: vi.fn((name: string) => Promise.resolve(responses[name])),
  } as unknown as SupabaseClient<Database>;
}

describe("admin funnel truth", () => {
  it("returns typed metrics from controlled facts and keeps a real zero", async () => {
    const result = await fetchAdminFunnels(client({
      admin_analytics_funnel_counts: {
        data: [{ tour_views: 0, booking_started: 0, confirmed: 0, paid: 0, review: 0 }],
        error: null,
      },
      admin_analytics_booking_cohorts: { data: [], error: null },
    }), "7d");

    expect(result.meta.trustedForKpi).toBe(true);
    expect(result.metrics.tour_view).toEqual({
      value: 0,
      status: "available",
      source: "controlled_analytics_events",
      message: null,
    });
    expect(result.metrics.paid.source).toBe("payment_ledger");
    expect(result.metrics.review.source).toBe("published_reviews");
    expect(result.funnel).toHaveLength(5);
  });

  it("returns unavailable/null instead of trusted zero after a query failure", async () => {
    const result = await fetchAdminFunnels(client({
      admin_analytics_funnel_counts: { data: null, error: { message: "offline" } },
      admin_analytics_booking_cohorts: { data: null, error: { message: "offline" } },
    }), "30d");

    expect(result.meta.trustedForKpi).toBe(false);
    expect(result.metrics.booking_started.value).toBeNull();
    expect(result.metrics.booking_started.status).toBe("unavailable");
    expect(result.funnel).toEqual([]);
    expect(result.cohorts).toEqual([]);
    expect(result.cohortsMetric.value).toBeNull();
  });
});
