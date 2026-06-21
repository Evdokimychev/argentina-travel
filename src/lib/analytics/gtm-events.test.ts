import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { COOKIE_CONSENT_STORAGE_KEY } from "@/lib/cookie-consent";
import { GTM_EVENTS, pushDataLayer, trackGtmEvent, trackTourView } from "@/lib/analytics/gtm-events";

describe("gtm-events", () => {
  beforeEach(() => {
    const dataLayer: Record<string, unknown>[] = [];
    const storage = new Map<string, string>();
    storage.set(
      COOKIE_CONSENT_STORAGE_KEY,
      JSON.stringify({
        necessary: true,
        analytics: true,
        personalization: false,
        decidedAt: new Date().toISOString(),
      })
    );

    vi.stubGlobal("window", {
      dataLayer,
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
      },
      dispatchEvent: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("pushDataLayer appends to window.dataLayer", () => {
    pushDataLayer({ event: "test" });
    expect(window.dataLayer).toEqual([{ event: "test" }]);
  });

  it("trackGtmEvent sends named event when analytics consent granted", () => {
    trackGtmEvent(GTM_EVENTS.contactFormSubmit, { form_name: "contact" });
    expect(window.dataLayer?.[0]).toMatchObject({
      event: GTM_EVENTS.contactFormSubmit,
      form_name: "contact",
    });
  });

  it("trackTourView includes tour metadata", () => {
    trackTourView({ slug: "patagonia-14", title: "Патагония 14 дней", priceUsd: 1200 });
    expect(window.dataLayer?.[0]).toMatchObject({
      event: GTM_EVENTS.tourView,
      item_id: "patagonia-14",
      item_category: "tour",
      value: 1200,
    });
  });
});
