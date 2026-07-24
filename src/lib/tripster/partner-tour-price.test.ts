import { describe, expect, it } from "vitest";
import {
  formatPartnerListedPrice,
  resolvePartnerListedPriceParts,
  resolvePartnerListingPriceUsd,
  resolvePartnerTourPriceFields,
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

describe("partner listed price display", () => {
  it("prefers Intl formatting over raw Tripster value_string", () => {
    const row = stubRow({
      id: 1,
      slug: "priced",
      price_value: 4905,
      price_currency: "USD",
      price_display: "$4905 за одного",
      payload: {
        id: 1,
        type: "tour",
        price: {
          value: 4905,
          currency: "USD",
          value_string: "$4905 за одного",
          unit_string: "за одного",
        },
      },
    });

    const fields = resolvePartnerTourPriceFields(row);
    expect(fields.display).toBe(formatPartnerListedPrice(4905, "USD", "за одного"));
    expect(fields.display).not.toContain("$$");
  });

  it("parses leading currency symbols without duplicating unit", () => {
    const parts = resolvePartnerListedPriceParts({
      partnerPriceDisplay: "$4905 за одного",
    });
    expect(parts).not.toBeNull();
    expect(parts!.amount).toContain("4");
    expect(parts!.unit).toBe("за одного");
    expect(`${parts!.amount} ${parts!.unit}`).not.toMatch(/за одного за одного/);
  });
});

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
