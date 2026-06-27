import { describe, expect, it } from "vitest";
import {
  buildTripsterExperienceOrderUrl,
  buildTripsterExperiencePageUrl,
  buildTripsterPartnerOpenUrl,
  extractTripsterExperienceId,
  extractTripsterOrderId,
  isBrokenTripsterOrderPath,
  isUsableTripsterCheckoutUrl,
  normalizeTripsterOrderUrl,
  partnerUrlMatchesExperience,
  resolveTripsterCheckoutUrl,
  resolveTripsterBookingRedirectFromApi,
} from "@/lib/tripster/checkout-url";

describe("tripster checkout url", () => {
  it("detects broken Tripster order paths", () => {
    expect(isBrokenTripsterOrderPath("/orders/12345/")).toBe(true);
    expect(isBrokenTripsterOrderPath("https://experience.tripster.ru/orders/12345/")).toBe(true);
    expect(
      isBrokenTripsterOrderPath(
        "https://experience.tripster.ru/experience/booking/92278/?date=2026-09-01"
      )
    ).toBe(false);
  });

  it("extracts order id from legacy and canonical paths", () => {
    expect(extractTripsterOrderId("https://experience.tripster.ru/orders/99999/")).toBe(99999);
    expect(extractTripsterOrderId("https://experience.tripster.ru/experience/order/99999/")).toBe(
      99999
    );
  });

  it("rewrites legacy order paths to experience order checkout", () => {
    expect(normalizeTripsterOrderUrl("https://experience.tripster.ru/orders/12345/")).toBe(
      "https://experience.tripster.ru/experience/order/12345/"
    );
    expect(buildTripsterExperienceOrderUrl(12345)).toBe(
      "https://experience.tripster.ru/experience/order/12345/"
    );
  });

  it("accepts experience order paths as usable checkout urls", () => {
    expect(isUsableTripsterCheckoutUrl("https://experience.tripster.ru/orders/12345/")).toBe(false);
    expect(
      isUsableTripsterCheckoutUrl("https://experience.tripster.ru/experience/order/12345/")
    ).toBe(true);
    expect(
      isUsableTripsterCheckoutUrl(
        "https://experience.tripster.ru/experience/booking/92278/?date=2026-09-01"
      )
    ).toBe(true);
  });

  it("builds direct Tripster booking url with form context", () => {
    const url = buildTripsterPartnerOpenUrl(50900, {
      startDate: "2026-09-01",
      time: "10:00",
      guests: 3,
      name: "Иван",
      email: "ivan@example.com",
      phone: "+79991234567",
      messageToGuide: "Нужен детский стульчик",
    });

    expect(url).toBe(
      "https://experience.tripster.ru/experience/booking/50900/?date=2026-09-01&time=10%3A00%3A00&persons_count=3&name=%D0%98%D0%B2%D0%B0%D0%BD&full_name=%D0%98%D0%B2%D0%B0%D0%BD&email=ivan%40example.com&phone=%2B79991234567&message_to_guide=%D0%9D%D1%83%D0%B6%D0%B5%D0%BD+%D0%B4%D0%B5%D1%82%D1%81%D0%BA%D0%B8%D0%B9+%D1%81%D1%82%D1%83%D0%BB%D1%8C%D1%87%D0%B8%D0%BA"
    );
  });

  it("prefers experience order checkout when API returns legacy order path", () => {
    const url = resolveTripsterCheckoutUrl(92278, "/orders/99999/", {
      startDate: "2026-09-01",
      time: "08:00",
      guests: 3,
      name: "Иван",
      email: "ivan@example.com",
      phone: "+79991234567",
    });

    expect(url).toBe("https://experience.tripster.ru/experience/order/99999/");
  });

  it("prefers explicit order id over broken partner url", () => {
    const url = resolveTripsterCheckoutUrl(
      92278,
      "https://experience.tripster.ru/experience/booking/92278/",
      {
        startDate: "2026-09-01",
        time: "08:00",
        guests: 3,
      },
      88888
    );

    expect(url).toBe("https://experience.tripster.ru/experience/order/88888/");
  });

  it("builds canonical experience page from id", () => {
    expect(buildTripsterExperiencePageUrl(50900, null)).toBe(
      "https://experience.tripster.ru/experience/50900/"
    );
  });

  it("ignores stale tripster_url when id mismatches", () => {
    expect(
      buildTripsterExperiencePageUrl(
        50900,
        "https://experience.tripster.ru/experience/99999/"
      )
    ).toBe("https://experience.tripster.ru/experience/50900/");
  });

  it("extracts experience id from booking checkout path", () => {
    expect(
      extractTripsterExperienceId(
        "https://experience.tripster.ru/experience/booking/50900/?date=2026-09-01"
      )
    ).toBe(50900);
  });

  it("extracts experience id from tp.media wrapper", () => {
    const wrapped =
      "https://tp.media/r?u=https%3A%2F%2Fexperience.tripster.ru%2Fexperience%2F50900%2F";
    expect(extractTripsterExperienceId(wrapped)).toBe(50900);
    expect(partnerUrlMatchesExperience(wrapped, 50900)).toBe(true);
    expect(partnerUrlMatchesExperience(wrapped, 87574)).toBe(false);
  });

  it("prefers server fallback url over client-built booking url", () => {
    const serverFallback =
      "https://tp.media/r?u=https%3A%2F%2Fexperience.tripster.ru%2Fexperience%2Fbooking%2F50900%2F%3Fdate%3D2026-09-01%26time%3D10%253A00%253A00%26persons_count%3D2";
    const url = resolveTripsterBookingRedirectFromApi({
      response: { ok: false, mode: "affiliate_fallback", fallbackUrl: serverFallback },
      experienceId: 50900,
      context: {
        startDate: "2026-09-01",
        time: "10:00",
        guests: 2,
        name: "Иван",
        email: "ivan@example.com",
        phone: "+79991234567",
      },
    });

    expect(url).toBe(serverFallback);
  });

  it("rebuilds fallback checkout when server fallback misses prefill params", () => {
    const url = resolveTripsterBookingRedirectFromApi({
      response: {
        ok: false,
        mode: "affiliate_fallback",
        fallbackUrl: "https://tp.media/r?u=https%3A%2F%2Fexperience.tripster.ru%2Fexperience%2Fbooking%2F50900%2F",
      },
      experienceId: 50900,
      context: {
        startDate: "2026-09-01",
        time: "10:00",
        guests: 2,
      },
    });

    expect(url).toContain("/experience/booking/50900/");
    expect(url).toContain("date=2026-09-01");
    expect(url).toContain("time=10%3A00%3A00");
    expect(url).toContain("persons_count=2");
  });

  it("rebuilds excursion redirect url when checkout params are incomplete", () => {
    const url = resolveTripsterBookingRedirectFromApi({
      response: {
        ok: true,
        mode: "tripster_order",
        orderUrl: "https://experience.tripster.ru/experience/booking/50900/?date=2026-09-01",
      },
      experienceId: 50900,
      context: {
        startDate: "2026-09-01",
        time: "12:00",
        guests: 2,
        name: "Иван",
        email: "ivan@example.com",
        phone: "+79991234567",
      },
    });

    expect(url).toContain("/experience/booking/50900/");
    expect(url).toContain("date=2026-09-01");
    expect(url).toContain("time=12%3A00%3A00");
    expect(url).toContain("persons_count=2");
  });

  it("uses order checkout url on successful api response", () => {
    const url = resolveTripsterBookingRedirectFromApi({
      response: {
        ok: true,
        mode: "tripster_order",
        orderId: 77777,
        orderUrl: "https://experience.tripster.ru/experience/order/77777/",
      },
      experienceId: 50900,
      context: { startDate: "2026-09-01", time: "10:00", guests: 2 },
    });

    expect(url).toBe("https://experience.tripster.ru/experience/order/77777/");
  });
});
