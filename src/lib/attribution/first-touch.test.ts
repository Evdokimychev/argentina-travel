import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildFirstTouchAttribution,
  parseFirstTouchAttribution,
  parseFirstTouchCookieHeader,
  persistFirstTouchAttribution,
  serializeFirstTouchAttribution,
} from "@/lib/attribution/first-touch";

describe("first-touch attribution", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("preserves the original capture timestamp when reading stored data", () => {
    const capturedAt = "2026-07-01T12:34:56.000Z";
    const parsed = parseFirstTouchAttribution(
      JSON.stringify({ utmSource: "newsletter", capturedAt })
    );

    expect(parsed).toMatchObject({ utmSource: "newsletter", capturedAt });
  });

  it("limits all user-controlled text fields", () => {
    const attribution = buildFirstTouchAttribution({
      utmSource: "s".repeat(500),
      utmMedium: "m".repeat(500),
      utmCampaign: "c".repeat(500),
      referrer: `https://example.com/${"r".repeat(800)}`,
      landingPath: `/article?query=${"q".repeat(800)}`,
    });

    expect(attribution?.utmSource).toHaveLength(160);
    expect(attribution?.utmMedium).toHaveLength(160);
    expect(attribution?.utmCampaign).toHaveLength(240);
    expect(attribution?.referrer).toHaveLength(500);
    expect(attribution?.landingPath).toHaveLength(500);
  });

  it("keeps only syntactically valid UUID API key identifiers", () => {
    expect(buildFirstTouchAttribution({ apiKeyId: "not-a-uuid" })).toBeNull();
    expect(
      buildFirstTouchAttribution({ apiKeyId: "123e4567-e89b-12d3-a456-426614174000" })
    ).toMatchObject({ apiKeyId: "123e4567-e89b-12d3-a456-426614174000" });
  });

  it("returns null instead of throwing for a malformed encoded cookie", () => {
    expect(() =>
      parseFirstTouchCookieHeader("session=ok; pva_ft_attribution=%E0%A4%A")
    ).not.toThrow();
    expect(parseFirstTouchCookieHeader("pva_ft_attribution=%E0%A4%A")).toBeNull();
  });

  it("rejects an oversized cookie value", () => {
    expect(parseFirstTouchCookieHeader(`pva_ft_attribution=${"x".repeat(4097)}`)).toBeNull();
  });

  it("round-trips normalized data through a cookie header", () => {
    const attribution = buildFirstTouchAttribution({
      utmSource: "  blog  ",
      utmCampaign: "winter",
      landingPath: "/blog/patagonia",
    });
    expect(attribution).not.toBeNull();

    const encoded = encodeURIComponent(serializeFirstTouchAttribution(attribution!));
    expect(parseFirstTouchCookieHeader(`other=1; pva_ft_attribution=${encoded}`)).toEqual(
      attribution
    );
  });

  it("keeps the persisted cookie below the browser size limit", () => {
    const setItem = vi.fn();
    let cookie = "";
    vi.stubGlobal("window", {
      location: { hostname: "goargentina.ru" },
      sessionStorage: { setItem },
    });
    vi.stubGlobal("document", {
      get cookie() {
        return cookie;
      },
      set cookie(value: string) {
        cookie = value;
      },
    });

    const attribution = buildFirstTouchAttribution({
      utmSource: "источник".repeat(40),
      utmMedium: "канал".repeat(50),
      utmCampaign: "кампания".repeat(50),
      referrer: `https://example.com/${"путь".repeat(200)}`,
      landingPath: `/статья/${"аргентина".repeat(100)}`,
    });
    expect(attribution).not.toBeNull();

    persistFirstTouchAttribution(attribution!);

    const encodedValue = cookie.slice(cookie.indexOf("=") + 1, cookie.indexOf(";"));
    expect(encodedValue.length).toBeLessThanOrEqual(4096);
    expect(parseFirstTouchCookieHeader(cookie)?.utmSource).toBeTruthy();
    expect(setItem).toHaveBeenCalledOnce();
  });
});
