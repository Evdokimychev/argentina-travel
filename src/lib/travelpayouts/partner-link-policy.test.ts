import { describe, expect, it } from "vitest";
import { isAllowedPartnerLinkDestination } from "@/lib/travelpayouts/partner-link-policy";

describe("Travelpayouts partner link destination policy", () => {
  it.each([
    "https://experience.tripster.ru/experience/123",
    "https://youtravel.me/tours/123",
    "https://www.sputnik8.com/ru/buenos-aires/activities/123",
    "https://www.airalo.com/argentina-esim",
    "https://intui.travel/transfer/123",
    "https://www.aviasales.ru/search/MOWBUE1",
  ])("allows an official partner destination: %s", (url) => {
    expect(isAllowedPartnerLinkDestination(url)).toBe(true);
  });

  it.each([
    "http://experience.tripster.ru/experience/123",
    "https://tripster.ru.evil.example/experience/123",
    "https://evil.example/collect",
    "javascript:alert(1)",
    "not-a-url",
    "https://user:password@youtravel.me/tours/123",
  ])("rejects an unsafe destination: %s", (url) => {
    expect(isAllowedPartnerLinkDestination(url)).toBe(false);
  });
});
