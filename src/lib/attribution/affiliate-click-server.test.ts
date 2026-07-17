import { describe, expect, it } from "vitest";
import { sanitizeAffiliateLogUrl } from "@/lib/attribution/affiliate-click-server";

describe("affiliate click privacy", () => {
  it("strips booking PII and tracking parameters from stored URLs", () => {
    expect(
      sanitizeAffiliateLogUrl(
        "https://experience.tripster.ru/experience/123?name=Иван&email=ivan%40example.com&phone=%2B79990000000#checkout",
      ),
    ).toBe("https://experience.tripster.ru/experience/123");
  });

  it("strips credentials and rejects unsafe protocols", () => {
    expect(sanitizeAffiliateLogUrl("https://user:secret@youtravel.me/tours/1?offer=2")).toBe(
      "https://youtravel.me/tours/1",
    );
    expect(sanitizeAffiliateLogUrl("javascript:alert(1)")).toBeNull();
  });
});
