import { beforeEach, describe, expect, it, vi } from "vitest";
import { COOKIE_CONSENT_STORAGE_KEY, COOKIE_CONSENT_VERSION } from "@/lib/cookie-consent";
import { PRODUCT_EVENT_NAMES, sanitizeProductEventDetails, trackProductEvent } from "@/lib/analytics/product-events";

describe("product event taxonomy", () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    vi.stubGlobal("window", {
      location: { pathname: "/mapa-argentina" },
      sessionStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) },
      localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) },
      dataLayer: [],
    });
    vi.stubGlobal("document", { cookie: "" });
  });

  it("uses unique snake_case names", () => {
    expect(new Set(PRODUCT_EVENT_NAMES).size).toBe(PRODUCT_EVENT_NAMES.length);
    expect(PRODUCT_EVENT_NAMES.every((name) => /^[a-z0-9_]+$/.test(name))).toBe(true);
  });

  it("redacts email and phone-like values", () => {
    const payload = sanitizeProductEventDetails({ entityId: "person@example.com", campaign: "+7 999 123-45-67" });
    expect(payload.entity_id).toBe("[redacted]");
    expect(payload.campaign).toBe("[redacted]");
  });

  it("does not emit without analytics consent", () => {
    trackProductEvent("map_opened");
    expect(window.dataLayer).toEqual([]);
  });

  it("emits only after analytics consent", () => {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify({ version: COOKIE_CONSENT_VERSION, necessary: true, analytics: true, personalization: false, decidedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 60_000).toISOString() }));
    trackProductEvent("map_opened", { source: "header" });
    expect(window.dataLayer?.[0]).toMatchObject({ event: "map_opened", event_version: 3, source: "header" });
  });
});
