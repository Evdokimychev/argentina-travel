import { describe, expect, it } from "vitest";
import {
  buildYouTravelCheckoutUrl,
  resolveYouTravelBookingRedirectFromApi,
} from "@/lib/youtravel/checkout-url";

describe("youtravel checkout url", () => {
  it("builds checkout url with order id", () => {
    expect(buildYouTravelCheckoutUrl(37808, "301168")).toBe(
      "https://youtravel.me/checkout/37808?orderId=301168"
    );
  });

  it("uses checkout route when API returns successful order id", () => {
    const url = resolveYouTravelBookingRedirectFromApi({
      response: {
        ok: true,
        mode: "youtravel_order",
        orderId: 301168,
        orderUrl: "https://youtravel.me/tours/37808",
      },
      tourId: 37808,
      fallbackUrl: "/api/affiliate/go/patagonia-yt37808?start_date=2026-10-01&guests=2",
    });

    expect(url).toBe("https://youtravel.me/checkout/37808?orderId=301168");
  });

  it("uses server fallback when API is unavailable", () => {
    const url = resolveYouTravelBookingRedirectFromApi({
      response: {
        ok: false,
        mode: "affiliate_fallback",
        fallbackUrl:
          "https://youtravel.me/tours/37808?start_date=2026-10-01&end_date=2026-10-10&guests=2",
      },
      tourId: 37808,
      fallbackUrl: "/api/affiliate/go/patagonia-yt37808?start_date=2026-10-01&guests=2",
    });

    expect(url).toBe(
      "https://youtravel.me/tours/37808?start_date=2026-10-01&end_date=2026-10-10&guests=2"
    );
  });

  it("falls back to client redirect path when server fallback is invalid", () => {
    const url = resolveYouTravelBookingRedirectFromApi({
      response: {
        ok: false,
        mode: "affiliate_fallback",
        fallbackUrl: "",
      },
      tourId: 37808,
      fallbackUrl: "/api/affiliate/go/patagonia-yt37808?start_date=2026-10-01&guests=2",
    });

    expect(url).toBe("/api/affiliate/go/patagonia-yt37808?start_date=2026-10-01&guests=2");
  });
});
