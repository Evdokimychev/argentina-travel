import { describe, expect, it } from "vitest";
import { CATALOG_PRICE_FILTER_REGRESSION_CASES } from "@/lib/youtravel/__fixtures__/regression-payloads";
import { filterTours, getDefaultFilters } from "@/lib/filter-tours";
import {
  resolveListingFilterPriceUsd,
  resolvePartnerTourFilterPriceUsd,
  resolveTripsterPartnerFilterPriceUsd,
} from "@/lib/partner-tours/filter-price";
import { getTourPriceBounds } from "@/lib/tour-price-bounds";
import { convertFromUsd } from "@/lib/currency";
import type { TourListing } from "@/types";

function stubListing(overrides: Partial<TourListing> & Pick<TourListing, "id" | "slug">): TourListing {
  return {
    title: "Тест",
    shortDescription: "",
    image: "/media/placeholders/tour-card.jpg",
    gallery: [],
    destination: "Буэнос-Айрес",
    region: "Аргентина",
    activityType: "Авторские туры",
    durationDays: 3,
    durationNights: 2,
    durationBucket: "2–3 дня",
    priceUsd: 100,
    accommodationType: "Отель",
    comfortLevel: "Стандарт",
    difficultyLevel: "Умеренная",
    language: ["Русский"],
    childrenAllowed: "Без ограничений",
    minimumAge: 0,
    groupSizeMin: 1,
    groupSizeMax: 8,
    groupSizeBucket: "До 8 человек",
    availableDates: [],
    latitude: -34.6,
    longitude: -58.4,
    rating: 0,
    reviewCount: 0,
    organizer: { name: "Гид", avatar: "", slug: "guide" },
    badges: [],
    ...overrides,
  };
}

describe("resolvePartnerTourFilterPriceUsd", () => {
  it("treats mislabeled 5628 RUB as USD for filter", () => {
    expect(
      resolvePartnerTourFilterPriceUsd({
        partnerSource: "youtravel",
        id: "yt-1",
        priceUsd: 5628,
        partnerPriceValue: 5628,
        partnerPriceCurrency: "RUB",
      })
    ).toBe(5628);
  });

  it("converts legitimate RUB partner price to USD", () => {
    const usd = resolvePartnerTourFilterPriceUsd({
      partnerSource: "youtravel",
      id: "yt-2",
      priceUsd: 400,
      partnerPriceValue: 40_000,
      partnerPriceCurrency: "RUB",
    });
    expect(usd).not.toBeNull();
    expect(usd!).toBeGreaterThan(300);
    expect(usd!).toBeLessThan(500);
  });
});

describe("resolveTripsterPartnerFilterPriceUsd", () => {
  it("uses partner RUB price for Tripster listings", () => {
    expect(
      resolveTripsterPartnerFilterPriceUsd({
        partnerSource: "tripster",
        id: "ts-1",
        priceUsd: 0,
        priceOnRequest: true,
        partnerPriceValue: 300_000,
        partnerPriceCurrency: "RUB",
      })
    ).toBeGreaterThan(3000);
  });
});

describe("catalog price filter regressions", () => {
  describe.each(CATALOG_PRICE_FILTER_REGRESSION_CASES)(
    "$id",
    ({ listing, filterCurrency, priceMin, priceMax, shouldMatch }) => {
      it("applies price filter to partner listings", () => {
        const tour = stubListing(listing);
        const filterPriceUsd = resolveListingFilterPriceUsd(tour);
        expect(filterPriceUsd).not.toBeNull();

        const filters = {
          ...getDefaultFilters(filterCurrency, [tour]),
          priceMin,
          priceMax,
        };
        const matched = filterTours([tour], filters, filterCurrency);
        expect(matched.length > 0).toBe(shouldMatch);
      });
    }
  );

  it("includes mislabeled partner price in catalog slider bounds", () => {
    const mislabeled = stubListing({
      id: "yt-bounds",
      slug: "yt-bounds",
      partnerSource: "youtravel",
      partnerPriceValue: 5628,
      partnerPriceCurrency: "RUB",
      priceUsd: 5628,
    });
    const native = stubListing({ id: "native", slug: "native", priceUsd: 61 });

    const { min, max } = getTourPriceBounds([mislabeled, native], "RUB");
    expect(min).toBe(convertFromUsd(61, "RUB"));
    expect(max).toBe(convertFromUsd(5628, "RUB"));
  });
});
