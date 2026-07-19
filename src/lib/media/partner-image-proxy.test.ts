import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildPartnerImageProxyUrl,
  isAllowedPartnerImageUrl,
} from "@/lib/media/partner-image-proxy";

describe("partner image proxy", () => {
  const youtravel =
    "https://cf.youtravel.me/public/images/tour/media/2024/08/16/example.JPG";

  afterEach(() => {
    vi.unstubAllEnvs();
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

  it("rejects unrelated hosts and unsafe paths", () => {
    expect(isAllowedPartnerImageUrl("https://example.com/photo.jpg")).toBe(false);
    expect(isAllowedPartnerImageUrl("https://cf.youtravel.me/private/file.jpg")).toBe(false);
    expect(buildPartnerImageProxyUrl("https://example.com/photo.jpg")).toBe(
      "https://example.com/photo.jpg",
    );
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
