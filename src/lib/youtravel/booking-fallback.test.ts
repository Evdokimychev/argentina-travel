import { describe, expect, it } from "vitest";
import {
  buildYouTravelAffiliateFallbackPath,
  buildYouTravelPartnerBookingUrl,
  parseYouTravelOfferDateId,
} from "@/lib/youtravel/partner-tour-utils";

describe("YouTravel booking fallback URLs", () => {
  it("builds affiliate fallback path with date range and contacts", () => {
    const path = buildYouTravelAffiliateFallbackPath({
      slug: "patagonia-yt42",
      startDate: "2026-08-01",
      endDate: "2026-08-10",
      guests: 2,
      name: "Иван Иванов",
      email: "ivan@example.com",
      phone: "+79991234567",
    });

    expect(path).toContain("/api/affiliate/go/patagonia-yt42");
    expect(path).toContain("start_date=2026-08-01");
    expect(path).toContain("end_date=2026-08-10");
    expect(path).toContain("guests=2");
    expect(path).toContain("email=ivan%40example.com");
  });

  it("parses offer id from yt-offer date id", () => {
    expect(parseYouTravelOfferDateId("yt-offer-123-0")).toEqual({ offerId: 123 });
    expect(parseYouTravelOfferDateId("tripster-slot-1")).toBeNull();
  });

  it("builds partner booking URL with query params", () => {
    const url = buildYouTravelPartnerBookingUrl(42, {
      tourSlug: "patagonia-yt42",
      startDate: "2026-08-01",
      endDate: "2026-08-10",
      guests: 3,
      offerId: 99,
      name: "Test",
      email: "test@example.com",
      phone: "+541112345678",
    });

    expect(url).toContain("https://youtravel.me/tours/patagonia-yt42");
    expect(url).toContain("start_date=2026-08-01");
    expect(url).toContain("end_date=2026-08-10");
    expect(url).toContain("guests=3");
    expect(url).toContain("offer_id=99");
  });
});
