import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildPartnerImageProxyUrl,
  fetchAllowedPartnerImage,
  isAllowedPartnerImageUrl,
} from "@/lib/media/partner-image-proxy";

describe("partner image proxy", () => {
  const youtravel =
    "https://cf.youtravel.me/public/images/tour/media/2024/08/16/example.JPG";

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uses the trusted YouTravel width transform by default", () => {
    expect(buildPartnerImageProxyUrl(youtravel, { width: 9999, quality: 12 })).toBe(
      "https://cf.youtravel.me/tr:w-1800/public/images/tour/media/2024/08/16/example.JPG",
    );
  });

  it("proxies and bounds trusted YouTravel images when explicitly enabled", () => {
    vi.stubEnv("NEXT_PUBLIC_PARTNER_IMAGE_PROXY", "true");
    const result = buildPartnerImageProxyUrl(youtravel, { width: 9999, quality: 12 });
    expect(result).toContain("/api/media/partner-image?");
    expect(result).toContain("w=1800");
    expect(result).toContain("q=55");
  });

  it("rejects unrelated hosts, credentials, IP literals, and unsafe paths", () => {
    expect(isAllowedPartnerImageUrl("https://example.com/photo.jpg")).toBe(false);
    expect(isAllowedPartnerImageUrl("https://cf.youtravel.me/private/file.jpg")).toBe(false);
    expect(isAllowedPartnerImageUrl("https://user:pass@cf.youtravel.me/public/images/x.jpg")).toBe(
      false,
    );
    expect(isAllowedPartnerImageUrl("https://127.0.0.1/public/images/x.jpg")).toBe(false);
    expect(buildPartnerImageProxyUrl("https://example.com/photo.jpg")).toBe(
      "https://example.com/photo.jpg",
    );
  });

  it("refuses redirects that leave the partner allowlist", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(null, {
          status: 302,
          headers: { location: "http://169.254.169.254/latest/meta-data/" },
        }),
      ),
    );

    const result = await fetchAllowedPartnerImage(youtravel);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("redirect_not_allowlisted");
  });

  it("accepts same-host allowlisted redirects and returns the final response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: {
            location: "https://cf.youtravel.me/public/images/tour/media/2024/08/16/final.JPG",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: { "content-type": "image/jpeg" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchAllowedPartnerImage(youtravel);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.finalUrl).toContain("/final.JPG");
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[0]?.[1]).toEqual(expect.objectContaining({ redirect: "manual" }));
    }
  });

  it("serves small catalog avatars without the 1440px default", () => {
    vi.stubEnv("NEXT_PUBLIC_PARTNER_IMAGE_PROXY", "true");
    const result = buildPartnerImageProxyUrl(youtravel, { width: 160, quality: 60 });
    expect(result).toContain("w=160");
    expect(result).toContain("q=60");
    expect(result).not.toContain("w=1440");

    const card = readFileSync(
      join(process.cwd(), "src/components/marketplace/MarketplaceTourCard.tsx"),
      "utf8",
    );
    expect(card).toContain("partnerImageWidth={160}");
    expect(card).toContain("partnerImageQuality={60}");
  });
});
