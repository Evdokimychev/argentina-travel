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

  it("maps Tripster-relative order paths to absolute URLs", () => {
    expect(normalizePartnerBookingUrl("/orders/12345/")).toBe(
      "https://experience.tripster.ru/orders/12345/"
    );
  });
});
