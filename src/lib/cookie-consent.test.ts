import { describe, expect, it } from "vitest";
import {
  COOKIE_CONSENT_VERSION,
  parseCookieConsentValue,
} from "./cookie-consent";

describe("cookie consent lifetime", () => {
  it("rejects legacy and expired consent", () => {
    expect(parseCookieConsentValue("accepted")).toBeNull();
    expect(
      parseCookieConsentValue(
        JSON.stringify({
          version: COOKIE_CONSENT_VERSION,
          necessary: true,
          analytics: true,
          personalization: true,
          decidedAt: "2025-01-01T00:00:00.000Z",
          expiresAt: "2025-01-02T00:00:00.000Z",
        }),
      ),
    ).toBeNull();
  });

  it("accepts a current version before expiry", () => {
    const value = parseCookieConsentValue(
      JSON.stringify({
        version: COOKIE_CONSENT_VERSION,
        necessary: true,
        analytics: false,
        personalization: true,
        decidedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      }),
    );
    expect(value?.personalization).toBe(true);
  });
});
