import { describe, expect, it } from "vitest";
import { fetchPartnerTourDetail } from "@/lib/tripster/partner-tour-repository";
import { fetchYouTravelTourDetail } from "@/lib/youtravel/partner-tour-repository";

function detailClient(result: { data: unknown; error: { message: string } | null }) {
  const query = {
    select: () => query,
    eq: () => query,
    maybeSingle: async () => result,
  };
  return { from: () => query } as never;
}

describe("partner REST repository error semantics", () => {
  it("keeps a confirmed Tripster miss distinct from a source failure", async () => {
    await expect(fetchPartnerTourDetail(
      detailClient({ data: null, error: null }),
      "confirmed-miss",
    )).resolves.toBeNull();

    await expect(fetchPartnerTourDetail(
      detailClient({ data: null, error: { message: "REST unavailable" } }),
      "source-failure",
    )).rejects.toThrow("Tripster REST detail lookup failed: REST unavailable");
  });

  it("keeps a confirmed YouTravel miss distinct from a source failure", async () => {
    await expect(fetchYouTravelTourDetail(
      detailClient({ data: null, error: null }),
      "confirmed-miss",
    )).resolves.toBeNull();

    await expect(fetchYouTravelTourDetail(
      detailClient({ data: null, error: { message: "REST unavailable" } }),
      "source-failure",
    )).rejects.toThrow("YouTravel REST detail lookup failed: REST unavailable");
  });
});
