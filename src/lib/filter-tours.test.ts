import { describe, expect, it } from "vitest";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { filterTours, countActiveFilters, getDefaultFilters } from "@/lib/filter-tours";
import {
  buildCatalogFilterSearchParams,
  parseCatalogFiltersFromSearchParams,
} from "@/lib/catalog-filter-url";
import { matchesTourFormat } from "@/lib/tour-format";
import type { TourListing } from "@/types";

function stubListing(overrides: Partial<TourListing> & Pick<TourListing, "id" | "slug">): TourListing {
  return {
    title: "Патагония экспресс",
    shortDescription: "Ледники и горы",
    image: "/media/placeholders/tour-card.jpg",
    gallery: [],
    destination: "Эль-Калафате",
    region: "Патагония",
    activityType: "Авторские туры",
    durationDays: 5,
    durationNights: 4,
    durationBucket: "4–7 дней",
    priceUsd: 2000,
    accommodationType: "Отель",
    comfortLevel: "Стандарт",
    difficultyLevel: "Умеренная",
    language: ["Русский", "Испанский"],
    childrenAllowed: "От 5 лет",
    minimumAge: 5,
    groupSizeMin: 2,
    groupSizeMax: 8,
    groupSizeBucket: "До 8 человек",
    bookingMode: "scheduled",
    availableDates: [{ start: "2026-09-01", end: "2026-09-06", spotsLeft: 6 }],
    latitude: -50.3,
    longitude: -72.3,
    rating: 4.8,
    reviewCount: 12,
    organizer: { name: "Гид", avatar: "", slug: "guide-1" },
    organizerOwnerId: "guide-1",
    badges: [],
    ...overrides,
  };
}

describe("catalog tour filters", () => {
  const base = stubListing({ id: "native-1", slug: "patagonia-native" });

  function filtersFor(tourSet: TourListing[], patch: Partial<ReturnType<typeof getDefaultFilters>> = {}) {
    return { ...getDefaultFilters("USD", tourSet), ...patch };
  }

  it("filters by text query across title and destination", () => {
    const dayTrip = stubListing({
      id: "day-1",
      slug: "ba-day",
      title: "Буэнос-Айрес за день",
      destination: "Буэнос-Айрес",
      durationDays: 1,
      durationNights: 0,
      durationBucket: "1–2 дня",
    });
    const filters = filtersFor([base, dayTrip], { query: "буэнос" });
    expect(filterTours([base, dayTrip], filters, "USD")).toEqual([dayTrip]);
  });

  it("filters by date range using availableDates", () => {
    const noDates = stubListing({ id: "no-dates", slug: "no-dates", availableDates: [] });
    const filters = filtersFor([base, noDates], {
      dateFrom: new Date("2026-09-01"),
      dateTo: new Date("2026-09-30"),
    });
    expect(filterTours([base, noDates], filters, "USD")).toEqual([base]);
  });

  it("filters by activity type", () => {
    const foodTour = stubListing({
      id: "food-1",
      slug: "food",
      activityType: "Гастрономические туры",
    });
    const filters = filtersFor([base, foodTour], {
      activityTypes: ["Гастрономические туры"],
    });
    expect(filterTours([base, foodTour], filters, "USD")).toEqual([foodTour]);
  });

  it("filters by duration presets and day trips", () => {
    const dayTrip = stubListing({
      id: "day-1",
      slug: "ba-day",
      durationDays: 1,
      durationNights: 0,
      durationBucket: "1–2 дня",
    });
    const longTour = stubListing({
      id: "long-1",
      slug: "long",
      durationDays: 10,
      durationNights: 9,
      durationBucket: "8–14 дней",
    });

    expect(filterTours([base, dayTrip, longTour], filtersFor([base, dayTrip, longTour], { dayTripsOnly: true }), "USD")).toEqual([dayTrip]);
    expect(
      filterTours([base, dayTrip, longTour], filtersFor([base, dayTrip, longTour], { durations: ["4–7 дней"] }), "USD")
    ).toEqual([base]);
  });

  it("filters by duration min/max range", () => {
    const shortTour = stubListing({
      id: "short-1",
      slug: "short",
      durationDays: 2,
      durationNights: 1,
      durationBucket: "1–2 дня",
    });
    const filters = filtersFor([base, shortTour], { durationMin: 4, durationMax: 6 });
    expect(filterTours([base, shortTour], filters, "USD")).toEqual([base]);
  });

  it("filters by accommodation, comfort, difficulty and language", () => {
    const tentTour = stubListing({
      id: "tent-1",
      slug: "tent",
      accommodationType: "Палатка",
    });
    const englishTour = stubListing({
      id: "en-1",
      slug: "english",
      language: ["Английский"],
    });

    expect(
      filterTours([base, tentTour], filtersFor([base, tentTour], { accommodations: ["Отель"] }), "USD")
    ).toEqual([base]);
    expect(
      filterTours([base, englishTour], filtersFor([base, englishTour], { languages: ["Испанский"] }), "USD")
    ).toEqual([base]);
  });

  it("filters children policy including adults-only trips", () => {
    const familyTour = stubListing({
      id: "family-1",
      slug: "family-tour",
      minimumAge: 0,
      childrenAllowed: "Без ограничений",
    });
    const teenTour = stubListing({
      id: "teen-1",
      slug: "teen",
      minimumAge: 12,
      childrenAllowed: "От 12 лет",
    });
    const adultsOnly = stubListing({
      id: "adults-1",
      slug: "adults-only",
      minimumAge: 18,
      childrenAllowed: "Только взрослые",
    });
    const tourSet = [base, familyTour, teenTour, adultsOnly];

    expect(filterTours(tourSet, filtersFor(tourSet, { childrenPolicy: "Без ограничений" }), "USD")).toEqual([familyTour]);
    expect(filterTours(tourSet, filtersFor(tourSet, { childrenPolicy: "От 8 лет" }), "USD")).toEqual([base, familyTour]);
    expect(filterTours(tourSet, filtersFor(tourSet, { childrenPolicy: "Только взрослые" }), "USD")).toEqual([adultsOnly]);
  });

  it("filters by group size and tour format", () => {
    const largeGroup = stubListing({
      id: "large-1",
      slug: "large",
      groupSizeBucket: "До 12 человек",
      groupSizeMax: 12,
    });
    const individual = stubListing({
      id: "solo-1",
      slug: "solo",
      groupSizeBucket: "Индивидуально",
      groupSizeMax: 1,
      bookingMode: "on_request",
    });

    expect(
      filterTours([base, largeGroup], filtersFor([base, largeGroup], { groupSizes: ["До 12 человек"] }), "USD")
    ).toEqual([largeGroup]);
    expect(matchesTourFormat(individual, ["individual"])).toBe(true);
    expect(
      filterTours([individual, base], filtersFor([individual, base], { tourFormats: ["individual"] }), "USD")
    ).toEqual([individual]);
  });

  it("filters by organizer slug", () => {
    const otherGuide = stubListing({
      id: "other-1",
      slug: "other",
      organizer: { name: "Другой", avatar: "", slug: "guide-2" },
      organizerOwnerId: "guide-2",
    });
    const filters = filtersFor([base, otherGuide], { organizerSlug: "guide-1" });
    expect(filterTours([base, otherGuide], filters, "USD")).toEqual([base]);
  });

  it("sorts by distance when nearMe is active", () => {
    const near = stubListing({
      id: "near-1",
      slug: "near",
      latitude: -34.61,
      longitude: -58.41,
    });
    const far = stubListing({
      id: "far-1",
      slug: "far",
      latitude: -50.3,
      longitude: -72.3,
    });
    const pair = [near, far];
    const filters = filtersFor(pair, {
      nearMe: true,
      userCoords: { lat: -34.6, lng: -58.4 },
    });
    const result = filterTours([far, near], filters, "USD");
    expect(result.map((t) => t.id)).toEqual(["near-1", "far-1"]);
  });

  it("counts active filters consistently", () => {
    const tourSet = [base];
    const filters = filtersFor(tourSet, {
      query: "патагония",
      activityTypes: ["Авторские туры"],
      childrenPolicy: "От 5 лет",
      groupSizes: ["До 8 человек"],
    });
    expect(countActiveFilters(filters, "USD", tourSet)).toBe(4);
  });

  it("round-trips catalog filters through URL params", () => {
    const tourSet = [base];
    const filters = filtersFor(tourSet, {
      query: "ледники",
      dateFrom: new Date("2026-09-01T12:00:00"),
      dateTo: new Date("2026-09-15T12:00:00"),
      activityTypes: ["Авторские туры" as const],
      priceMin: 10_000,
      priceMax: 250_000,
      durations: ["4–7 дней" as const],
      accommodations: ["Отель" as const],
      comfortLevels: ["Стандарт" as const],
      difficultyLevels: ["Умеренная" as const],
      languages: ["Русский" as const],
      childrenPolicy: "От 5 лет" as const,
      groupSizes: ["До 8 человек" as const],
      tourFormats: ["group" as const],
      instantBookingOnly: true,
      includeNeighboringCountries: true,
      organizerSlug: "guide-1",
    });

    const params = buildCatalogFilterSearchParams(filters, "price_asc", "RUB", tourSet, "list");
    const parsed = parseCatalogFiltersFromSearchParams(
      params as ReadonlyURLSearchParams,
      "RUB",
      tourSet,
    );

    expect(parsed.query).toBe("ледники");
    expect(parsed.dateFrom?.toISOString().slice(0, 10)).toBe("2026-09-01");
    expect(parsed.dateTo?.toISOString().slice(0, 10)).toBe("2026-09-15");
    expect(parsed.activityTypes).toEqual(["Авторские туры"]);
    expect(parsed.priceMin).toBe(10_000);
    expect(parsed.priceMax).toBe(250_000);
    expect(parsed.durations).toEqual(["4–7 дней"]);
    expect(parsed.accommodations).toEqual(["Отель"]);
    expect(parsed.comfortLevels).toEqual(["Стандарт"]);
    expect(parsed.difficultyLevels).toEqual(["Умеренная"]);
    expect(parsed.languages).toEqual(["Русский"]);
    expect(parsed.childrenPolicy).toBe("От 5 лет");
    expect(parsed.groupSizes).toEqual(["До 8 человек"]);
    expect(parsed.tourFormats).toEqual(["group"]);
    expect(parsed.instantBookingOnly).toBe(true);
    expect(parsed.includeNeighboringCountries).toBe(true);
    expect(parsed.organizerSlug).toBe("guide-1");
  });

  it("excludes neighboring-country tours from default catalog filter", () => {
    const argentina = stubListing({ id: "ar-1", slug: "ar-tour", country: "Argentina" });
    const brazil = stubListing({
      id: "br-1",
      slug: "rio-carnival",
      country: "Brazil",
      title: "Карнавал в Рио",
      destination: "Rio de Janeiro",
      region: "Rio de Janeiro",
      partnerSource: "tripster",
    });
    const filters = filtersFor([argentina, brazil]);
    expect(filterTours([argentina, brazil], filters, "USD").map((t) => t.id)).toEqual(["ar-1"]);

    const withNeighbors = filtersFor([argentina, brazil], { includeNeighboringCountries: true });
    expect(filterTours([argentina, brazil], withNeighbors, "USD").map((t) => t.id)).toEqual([
      "ar-1",
      "br-1",
    ]);
  });
});
