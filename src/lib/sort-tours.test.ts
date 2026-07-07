import { describe, expect, it } from "vitest";
import { addDays, format, startOfDay } from "date-fns";
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
  const today = startOfDay(new Date());
  const dateFromToday = (days: number) => format(addDays(today, days), "yyyy-MM-dd");

  it("picks the nearest upcoming departure, not the first array item", () => {
    const soonDate = dateFromToday(9);
    const tour = stubListing({
      id: "1",
      slug: "tour-1",
      availableDates: [
        { start: dateFromToday(-90), end: dateFromToday(-83), spotsLeft: 0 },
        { start: dateFromToday(80), end: dateFromToday(87), spotsLeft: 4 },
        { start: soonDate, end: dateFromToday(16), spotsLeft: 2 },
      ],
    });

    expect(resolveNearestUpcomingDepartureStart(tour, today)).toBe(soonDate);
  });

  it("sorts tours by nearest upcoming departure", () => {
    const soon = stubListing({
      id: "1",
      slug: "soon",
      availableDates: [{ start: dateFromToday(30), end: dateFromToday(37), spotsLeft: 2 }],
    });
    const later = stubListing({
      id: "2",
      slug: "later",
      availableDates: [{ start: dateFromToday(90), end: dateFromToday(97), spotsLeft: 2 }],
    });
    const noDates = stubListing({ id: "3", slug: "none", availableDates: [] });

    const sorted = sortTours([later, noDates, soon], "date_asc");
    expect(sorted.map((t) => t.slug)).toEqual(["soon", "later", "none"]);
  });

  it("puts tours with only past dates at the end", () => {
    const pastOnly = stubListing({
      id: "1",
      slug: "past",
      availableDates: [{ start: dateFromToday(-90), end: dateFromToday(-83), spotsLeft: 0 }],
    });
    const upcoming = stubListing({
      id: "2",
      slug: "upcoming",
      availableDates: [{ start: dateFromToday(30), end: dateFromToday(37), spotsLeft: 2 }],
    });

    expect(
      resolveNearestUpcomingDepartureTimestamp(pastOnly, today),
    ).toBeGreaterThan(resolveNearestUpcomingDepartureTimestamp(upcoming, today));
  });
});
