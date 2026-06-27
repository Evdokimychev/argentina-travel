import { describe, expect, it } from "vitest";
import { normalizePartnerBookingUrl } from "@/lib/tripster/open-partner-booking-url";

describe("normalizePartnerBookingUrl", () => {
  it("keeps absolute Tripster checkout URLs unchanged", () => {
    const url = "https://experience.tripster.ru/mfs/experience/booking/92278/?date=2026-09-01";
    expect(normalizePartnerBookingUrl(url)).toBe(url);
  });

  it("resolves affiliate redirect paths against site origin", () => {
    expect(
      normalizePartnerBookingUrl(
        "/api/affiliate/go/patagonia-t92278?start_date=2026-09-01&guests=2",
        "https://goargentina.ru"
      )
    ).toBe("https://goargentina.ru/api/affiliate/go/patagonia-t92278?start_date=2026-09-01&guests=2");
  });

  it("does not treat Tripster order paths as openable checkout urls", () => {
    expect(normalizePartnerBookingUrl("/orders/12345/")).toBe("/orders/12345/");
  });
});
