import { describe, expect, it } from "vitest";
import {
  buildMarketplaceDepartureIndex,
  buildTourDepartureHref,
  resolveMarketplaceDepartureDayCount,
} from "@/lib/marketplace-departure-calendar";
import type { TourListing } from "@/types";

function stubTour(overrides: Partial<TourListing> & Pick<TourListing, "id" | "slug">): TourListing {
  return {
    title: "Тестовый тур",
    shortDescription: "",
    image: "/media/placeholders/tour-card.jpg",
    gallery: [],
    destination: "Патагония",
    region: "Аргентина",
    activityType: "Авторские туры",
    durationDays: 7,
    durationNights: 6,
    durationBucket: "4–7 дней",
    priceUsd: 1200,
    accommodationType: "Отель",
    comfortLevel: "Стандарт",
    difficultyLevel: "Умеренная",
    language: ["Русский"],
    childrenAllowed: "Без ограничений",
    minimumAge: 0,
    groupSizeMin: 1,
    groupSizeMax: 12,
    groupSizeBucket: "До 12 человек",
    availableDates: [],
    latitude: -50,
    longitude: -70,
    rating: 4.8,
    reviewCount: 10,
    organizer: { name: "Гид", avatar: "", slug: "guide" },
    badges: [],
    ...overrides,
  };
}

describe("buildMarketplaceDepartureIndex", () => {
  it("groups departures by start date and skips past dates", () => {
    const index = buildMarketplaceDepartureIndex(
      [
        stubTour({
          id: "t1",
          slug: "patagonia",
          availableDates: [
            { start: "2026-01-01", end: "2026-01-07", spotsLeft: 4 },
            { start: "2027-03-10", end: "2027-03-17", spotsLeft: 2 },
          ],
        }),
        stubTour({
          id: "t2",
          slug: "ushuaia",
          title: "Ушуайя",
          availableDates: [{ start: "2027-03-10", end: "2027-03-14", spotsLeft: 6 }],
        }),
      ],
      { today: new Date("2026-06-01T12:00:00") }
    );

    expect(index.totalDepartures).toBe(2);
    expect(index.tourCountWithDates).toBe(2);
    expect(index.byStartDate.get("2027-03-10")).toHaveLength(2);
    expect(index.earliestDate).toBe("2027-03-10");
  });

  it("counts tripster tours without cached dates", () => {
    const index = buildMarketplaceDepartureIndex([
      stubTour({
        id: "yt-1",
        slug: "patagonia-yt42",
        partnerSource: "youtravel",
        availableDates: [{ start: "2027-04-01", end: "2027-04-08", spotsLeft: 3 }],
      }),
      stubTour({
        id: "ts-1",
        slug: "buenos-aires-t99",
        partnerSource: "tripster",
        availableDates: [],
      }),
    ]);

    expect(index.tripsterWithoutDates).toBe(1);
    expect(index.totalDepartures).toBe(1);
  });
});

describe("resolveMarketplaceDepartureDayCount", () => {
  it("returns count for a calendar day", () => {
    const index = buildMarketplaceDepartureIndex([
      stubTour({
        id: "t1",
        slug: "patagonia",
        availableDates: [{ start: "2027-05-01", end: "2027-05-08", spotsLeft: 2 }],
      }),
    ]);

    expect(
      resolveMarketplaceDepartureDayCount(index, new Date("2027-05-01T12:00:00"))
    ).toBe(1);
  });
});

describe("buildTourDepartureHref", () => {
  it("builds tour detail link with departure param", () => {
    expect(buildTourDepartureHref("patagonia", "2027-05-01")).toBe(
      "/tours/patagonia?departure=2027-05-01#booking"
    );
  });
});
