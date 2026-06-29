import { describe, expect, it } from "vitest";
import {
  TOUR_PRICE_ON_REQUEST_LABEL,
  formatTourCatalogSeoPriceLabel,
  isTourPriceOnRequest,
} from "@/lib/tour-price-public";

describe("isTourPriceOnRequest", () => {
  it("is true when priceOnRequest flag is set", () => {
    expect(isTourPriceOnRequest({ priceUsd: 500, priceOnRequest: true })).toBe(true);
  });

  it("is true when priceUsd is zero even without flag", () => {
    expect(isTourPriceOnRequest({ priceUsd: 0 })).toBe(true);
  });

  it("is false for positive fixed price", () => {
    expect(isTourPriceOnRequest({ priceUsd: 1200, priceOnRequest: false })).toBe(false);
  });
});

describe("formatTourCatalogSeoPriceLabel", () => {
  it("returns on-request label for zero or unknown price", () => {
    expect(formatTourCatalogSeoPriceLabel({ priceUsd: 0, priceOnRequest: true })).toBe(
      TOUR_PRICE_ON_REQUEST_LABEL
    );
    expect(formatTourCatalogSeoPriceLabel({ priceUsd: 0 })).toBe(TOUR_PRICE_ON_REQUEST_LABEL);
  });

  it("formats fixed USD price", () => {
    expect(formatTourCatalogSeoPriceLabel({ priceUsd: 1200 })).toBe("1200 USD");
  });

  it("adds от prefix when priceFromPrefix is set", () => {
    expect(
      formatTourCatalogSeoPriceLabel({ priceUsd: 4055, priceFromPrefix: true })
    ).toBe("от 4055 USD");
  });
});
