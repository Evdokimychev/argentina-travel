import { describe, expect, it } from "vitest";
import { startOfDay } from "date-fns";
import {
  resolveNearestUpcomingDepartureStart,
  resolveNearestUpcomingDepartureTimestamp,
} from "@/lib/tour-departure-dates";
import { sortTours } from "@/lib/sort-tours";
import type { TourListing } from "@/types";

function stubListing(
  overrides: Partial<TourListing> & Pick<TourListing, "id" | "slug">,
): TourListing {
  return {
    title: "Тест",
    shortDescription: "",
    image: "",
    gallery: [],
    destination: "Буэнос-Айрес",
    region: "Аргентина",
    activityType: "Авторские туры",
    durationDays: 7,
    durationNights: 6,
    durationBucket: "4–7 дней",
    priceUsd: 1000,
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
    latitude: 0,
    longitude: 0,
    rating: 0,
    reviewCount: 0,
    organizer: { name: "Гид", avatar: "", slug: "guide" },
    badges: [],
    ...overrides,
  };
}

describe("tour departure date sort", () => {
  const today = startOfDay(new Date("2026-06-22"));

  it("picks the nearest upcoming departure, not the first array item", () => {
    const tour = stubListing({
      id: "1",
      slug: "tour-1",
      availableDates: [
        { start: "2026-03-01", end: "2026-03-08", spotsLeft: 0 },
        { start: "2026-09-10", end: "2026-09-17", spotsLeft: 4 },
        { start: "2026-07-01", end: "2026-07-08", spotsLeft: 2 },
      ],
    });

    expect(resolveNearestUpcomingDepartureStart(tour, today)).toBe("2026-07-01");
  });

  it("sorts tours by nearest upcoming departure", () => {
    const soon = stubListing({
      id: "1",
      slug: "soon",
      availableDates: [{ start: "2026-07-01", end: "2026-07-08", spotsLeft: 2 }],
    });
    const later = stubListing({
      id: "2",
      slug: "later",
      availableDates: [{ start: "2026-10-01", end: "2026-10-08", spotsLeft: 2 }],
    });
    const noDates = stubListing({ id: "3", slug: "none", availableDates: [] });

    const sorted = sortTours([later, noDates, soon], "date_asc");
    expect(sorted.map((t) => t.slug)).toEqual(["soon", "later", "none"]);
  });

  it("puts tours with only past dates at the end", () => {
    const pastOnly = stubListing({
      id: "1",
      slug: "past",
      availableDates: [{ start: "2026-01-01", end: "2026-01-08", spotsLeft: 0 }],
    });
    const upcoming = stubListing({
      id: "2",
      slug: "upcoming",
      availableDates: [{ start: "2026-08-01", end: "2026-08-08", spotsLeft: 2 }],
    });

    expect(
      resolveNearestUpcomingDepartureTimestamp(pastOnly, today),
    ).toBeGreaterThan(resolveNearestUpcomingDepartureTimestamp(upcoming, today));
  });
});
