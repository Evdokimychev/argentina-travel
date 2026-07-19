import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isAllowedTravelpayoutsTargetUrl } from "@/lib/travelpayouts/target-url";

describe("Travelpayouts Links API target allowlist", () => {
  it.each([
    "https://experience.tripster.ru/experience/booking/50900/?date=2026-09-01",
    "https://youtravel.me/tours/patagonia-yt42",
    "https://www.sputnik8.com/buenos-aires/123",
  ])("allows a supported partner target: %s", (url) => {
    expect(isAllowedTravelpayoutsTargetUrl(url)).toBe(true);
  });

  it.each([
    "http://experience.tripster.ru/experience/50900",
    "https://experience.tripster.ru.evil.example/experience/50900",
    "https://tp.media/r?u=https://evil.example",
    "https://user:password@youtravel.me/tours/42",
    "not-a-url",
  ])("rejects an unsafe target: %s", (url) => {
    expect(isAllowedTravelpayoutsTargetUrl(url)).toBe(false);
  });

  it("keeps the credential proxy disabled by default and rate-limited", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/travelpayouts/links/route.ts"),
      "utf8",
    );
    expect(source).toContain('TRAVELPAYOUTS_LINKS_ROUTE_ENABLED !== "true"');
    expect(source).toContain("isAllowedTravelpayoutsTargetUrl");
    expect(source).toContain("withRateLimit");
  });
});
