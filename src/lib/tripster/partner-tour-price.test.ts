import { describe, expect, it } from "vitest";
import {
  resolvePartnerListingPriceUsd,
  resolvePartnerTourPriceUsd,
} from "@/lib/tripster/partner-tour-price";
import type { PartnerTourExperienceRow } from "@/lib/tripster/partner-tour-mapper";

function stubRow(
  overrides: Partial<PartnerTourExperienceRow> & Pick<PartnerTourExperienceRow, "id" | "slug">
): PartnerTourExperienceRow {
  return {
    country_id: 65,
    city_id: 204,
    title: "Тест",
    review_count: 0,
    duration_minutes: 0,
    experience_type: "tour",
    ...overrides,
  };
}

describe("resolvePartnerListingPriceUsd", () => {
  it("converts RUB listing price to USD", () => {
    const usd = resolvePartnerListingPriceUsd(373_099, "RUB");
    expect(usd).not.toBeNull();
    expect(usd!).toBeGreaterThan(3000);
    expect(usd!).toBeLessThan(5000);
  });

  it("returns null for zero or missing value", () => {
    expect(resolvePartnerListingPriceUsd(0, "USD")).toBeNull();
    expect(resolvePartnerListingPriceUsd(null, "USD")).toBeNull();
  });
});

describe("resolvePartnerTourPriceUsd", () => {
  it("maps RUB partner row to positive USD without priceOnRequest", () => {
    const row = stubRow({
      id: 92278,
      slug: "patagonia-t92278",
      price_value: 373_099,
      price_currency: "RUB",
      payload: {
        id: 92278,
        type: "tour",
        price: { value: 373_099, currency: "RUB", price_from: true },
      },
    });

    const result = resolvePartnerTourPriceUsd(row);
    expect(result.priceOnRequest).toBe(false);
    expect(result.priceUsd).toBeGreaterThan(3000);
    expect(result.priceFromPrefix).toBe(true);
  });

  it("marks unknown or zero price as priceOnRequest", () => {
    const row = stubRow({
      id: 1,
      slug: "no-price",
      price_value: null,
      price_currency: null,
    });

    const result = resolvePartnerTourPriceUsd(row);
    expect(result.priceOnRequest).toBe(true);
    expect(result.priceUsd).toBe(0);
  });
});
