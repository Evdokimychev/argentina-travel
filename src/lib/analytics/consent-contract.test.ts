import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  acceptNecessaryOnlyCookieConsent,
  saveCookieConsent,
} from "@/lib/cookie-consent";
import { GTM_EVENTS, trackGtmEvent } from "@/lib/analytics/gtm-events";
import { trackProductEvent } from "@/lib/analytics/product-events";

describe("analytics consent contract", () => {
  beforeEach(() => {
    const local = new Map<string, string>();
    const session = new Map<string, string>();
    vi.stubEnv("NEXT_PUBLIC_YANDEX_METRIKA_ID", "110458660");
    vi.stubGlobal("window", {
      dataLayer: [],
      localStorage: {
        getItem: (key: string) => local.get(key) ?? null,
        setItem: (key: string, value: string) => local.set(key, value),
      },
      sessionStorage: {
        getItem: (key: string) => session.get(key) ?? null,
        setItem: (key: string, value: string) => session.set(key, value),
      },
      location: { pathname: "/tours/patagonia" },
      dispatchEvent: vi.fn(),
      ym: vi.fn(),
    });
    vi.stubGlobal("document", { cookie: "" });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("is denied by default and stops every app event immediately after revoke", () => {
    trackGtmEvent(GTM_EVENTS.tourView, { product_id: "tour-1" });
    trackProductEvent("map_opened", { source: "tour_detail" });
    expect(window.dataLayer).toEqual([]);

    saveCookieConsent({ analytics: true, personalization: false });
    trackGtmEvent(GTM_EVENTS.tourView, { product_id: "tour-1" });
    trackProductEvent("map_opened", { source: "tour_detail" });
    const emittedBeforeRevoke = window.dataLayer?.filter((entry) => !Array.isArray(entry)).length;
    expect(emittedBeforeRevoke).toBe(2);
    expect(window.ym).toHaveBeenCalledTimes(1);

    acceptNecessaryOnlyCookieConsent();
    const consentUpdate = window.dataLayer?.findLast((entry) => Array.isArray(entry));
    expect(consentUpdate).toEqual([
      "consent",
      "update",
      expect.objectContaining({ analytics_storage: "denied" }),
    ]);

    trackGtmEvent(GTM_EVENTS.tourView, { product_id: "tour-2" });
    trackProductEvent("map_opened", { source: "tour_detail" });
    expect(window.dataLayer?.filter((entry) => !Array.isArray(entry))).toHaveLength(2);
    expect(window.ym).toHaveBeenCalledTimes(1);
  });
});
