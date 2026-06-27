import { describe, expect, it } from "vitest";
import {
  isBrokenTripsterOrderPath,
  isUsableTripsterCheckoutUrl,
  resolveTripsterCheckoutUrl,
} from "@/lib/tripster/checkout-url";

describe("tripster checkout url", () => {
  it("detects broken Tripster order paths", () => {
    expect(isBrokenTripsterOrderPath("/orders/12345/")).toBe(true);
    expect(isBrokenTripsterOrderPath("https://experience.tripster.ru/orders/12345/")).toBe(true);
    expect(
      isBrokenTripsterOrderPath(
        "https://experience.tripster.ru/mfs/experience/booking/92278/?date=2026-09-01"
      )
    ).toBe(false);
  });

  it("rejects order paths as usable checkout urls", () => {
    expect(isUsableTripsterCheckoutUrl("https://experience.tripster.ru/orders/12345/")).toBe(false);
    expect(
      isUsableTripsterCheckoutUrl(
        "https://experience.tripster.ru/mfs/experience/booking/92278/?date=2026-09-01"
      )
    ).toBe(true);
  });

  it("falls back to prefilled MFS booking when API returns order path", () => {
    const url = resolveTripsterCheckoutUrl(92278, "/orders/99999/", {
      startDate: "2026-09-01",
      time: "08:00",
      guests: 3,
      name: "Иван",
      email: "ivan@example.com",
      phone: "+79991234567",
    });

    expect(url).toContain("/mfs/experience/booking/92278/");
    expect(url).toContain("date=2026-09-01");
    expect(url).toContain("time=08%3A00");
    expect(url).toContain("persons_count=3");
    expect(url).toContain("name=%D0%98%D0%B2%D0%B0%D0%BD");
    expect(url).toContain("email=ivan%40example.com");
    expect(url).toContain("phone=%2B79991234567");
  });
});
