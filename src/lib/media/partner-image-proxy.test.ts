import { describe, expect, it } from "vitest";
import {
  buildPartnerImageProxyUrl,
  isAllowedPartnerImageUrl,
} from "@/lib/media/partner-image-proxy";

describe("partner image proxy", () => {
  const youtravel =
    "https://cf.youtravel.me/public/images/tour/media/2024/08/16/example.JPG";

  it("proxies and bounds trusted YouTravel images", () => {
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
});
