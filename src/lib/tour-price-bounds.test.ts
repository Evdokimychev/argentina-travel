import { describe, expect, it } from "vitest";
import {
  convertFromUsd,
  getSliderPriceBounds,
  getSliderPriceStep,
} from "@/lib/currency";
import { filterTours, getDefaultFilters } from "@/lib/filter-tours";
import {
  getDefaultPriceRange,
  getTourPriceBounds,
  isPriceFilterActive,
  resolvePriceFilterSliderTrackMax,
  syncPriceFilters,
} from "@/lib/tour-price-bounds";
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

describe("tour price filter bounds", () => {
  const cheap = stubListing({ id: "cheap", slug: "cheap", priceUsd: 61 });
  const expensive = stubListing({ id: "premium", slug: "premium", priceUsd: 9000 });
  const tours = [cheap, expensive];

  it("derives catalog min/max from tour prices in RUB", () => {
    const { min, max } = getTourPriceBounds(tours, "RUB");
    expect(min).toBe(convertFromUsd(61, "RUB"));
    expect(max).toBe(convertFromUsd(9000, "RUB"));
  });

  it("snaps slider ceiling when catalog max exceeds filter cap", () => {
    const { priceMin, priceMax } = getDefaultPriceRange(tours, "RUB");
    const catalogMin = convertFromUsd(61, "RUB");
    const catalogMax = convertFromUsd(9000, "RUB");

    expect(priceMin).toBe(catalogMin);
    expect(priceMax).toBeGreaterThanOrEqual(catalogMax);

    const step = getSliderPriceStep(catalogMin, catalogMax);
    const { max: sliderMax } = getSliderPriceBounds(catalogMin, catalogMax, step);
    expect(priceMax).toBe(sliderMax);
    expect(priceMax).toBeGreaterThanOrEqual(catalogMax);
  });

  it("zooms slider track when narrowed range is far below catalog max", () => {
    const catalogMin = convertFromUsd(61, "RUB");
    const fullSliderMax = convertFromUsd(9000, "RUB");
    const filterCap = convertFromUsd(3000, "RUB");
    const narrowedMax = convertFromUsd(686, "RUB");

    const trackMax = resolvePriceFilterSliderTrackMax({
      priceMin: catalogMin,
      priceMax: narrowedMax,
      catalogMin,
      fullSliderMax,
      filterCap,
    });

    expect(trackMax).toBeLessThan(fullSliderMax);
    expect(trackMax).toBeGreaterThanOrEqual(filterCap);
    expect(trackMax).toBeGreaterThanOrEqual(narrowedMax);
  });

  it("converts stored price range when currency changes", () => {
    const defaultsUsd = getDefaultFilters("USD", tours);
    const narrowedUsd = {
      ...defaultsUsd,
      priceMin: 100,
      priceMax: 500,
    };

    const synced = syncPriceFilters(narrowedUsd, tours, "RUB", convertFromUsd(61, "USD"), "USD");
    expect(synced.filters.priceMin).toBe(convertFromUsd(100, "RUB"));
    expect(synced.filters.priceMax).toBe(convertFromUsd(500, "RUB"));
  });

  it("filters tours inside selected RUB range", () => {
    const defaults = getDefaultFilters("RUB", tours);
    expect(filterTours(tours, defaults, "RUB")).toHaveLength(2);

    const narrowed = {
      ...defaults,
      priceMin: convertFromUsd(100, "RUB"),
      priceMax: convertFromUsd(500, "RUB"),
    };
    expect(isPriceFilterActive(narrowed.priceMin, narrowed.priceMax, "RUB", tours)).toBe(true);
    expect(filterTours(tours, narrowed, "RUB")).toHaveLength(0);

    const midRange = {
      ...defaults,
      priceMin: convertFromUsd(50, "RUB"),
      priceMax: convertFromUsd(200, "RUB"),
    };
    expect(filterTours(tours, midRange, "RUB")).toEqual([cheap]);
  });
});
