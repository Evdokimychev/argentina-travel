import { describe, expect, it } from "vitest";
import { buildPartnerTourAffiliateFallbackPath } from "@/lib/partner-tour/affiliate-fallback";

describe("buildPartnerTourAffiliateFallbackPath", () => {
  it("builds YouTravel affiliate path with offer id", () => {
    const path = buildPartnerTourAffiliateFallbackPath({
      slug: "patagonia-yt42",
      partner: "youtravel",
      startDate: "2026-08-01",
      endDate: "2026-08-10",
      guests: 2,
      name: "Иван",
      email: "ivan@example.com",
      phone: "+79991234567",
      offerId: 99,
    });

    expect(path).toContain("/api/affiliate/go/patagonia-yt42");
    expect(path).toContain("offer_id=99");
  });

  it("builds Tripster affiliate path with time", () => {
    const path = buildPartnerTourAffiliateFallbackPath({
      slug: "buenos-aires-ts123",
      partner: "tripster",
      startDate: "2026-08-01",
      guests: 3,
      time: "10:00",
      name: "Test",
      email: "test@example.com",
      phone: "+541112345678",
    });

    expect(path).toContain("/api/affiliate/go/buenos-aires-ts123");
    expect(path).toContain("time=10%3A00");
    expect(path).toContain("guests=3");
  });
});
