import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  acceptNecessaryOnlyCookieConsent,
  saveCookieConsent,
} from "@/lib/cookie-consent";
import { hasInteractionTrackingConsent } from "@/lib/personalization/interaction-consent";

function stubBrowserStorage() {
  const storage = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
    },
    dispatchEvent: vi.fn(),
  });
  vi.stubGlobal("document", {
    cookie: "",
  });
}

describe("interaction-consent", () => {
  beforeEach(() => {
    stubBrowserStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requires personalization category, not merely a consent decision", () => {
    acceptNecessaryOnlyCookieConsent();
    expect(hasInteractionTrackingConsent()).toBe(false);

    saveCookieConsent({ analytics: true, personalization: false });
    expect(hasInteractionTrackingConsent()).toBe(false);

    saveCookieConsent({ analytics: false, personalization: true });
    expect(hasInteractionTrackingConsent()).toBe(true);
  });
});
