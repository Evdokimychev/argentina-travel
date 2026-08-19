import { describe, expect, it } from "vitest";
import { resolveTourCardScheduleDisplay } from "@/lib/tour-public-display";
import type { TourListing } from "@/types";

function listing(partial: Partial<TourListing>): TourListing {
  return {
    id: "yt-1",
    slug: "patagonia",
    title: "Патагония",
    destination: "Патагония",
    region: "Патагония",
    country: "Аргентина",
    durationDays: 7,
    durationNights: 6,
    durationBucket: "4–7 дней",
    priceUsd: 1200,
    rating: 4.8,
    reviewCount: 10,
    image: "/media/tours/cover.jpg",
    gallery: ["/media/tours/cover.jpg"],
    badges: [],
    activityType: "Пешие туры",
    accommodationType: "Отель",
    comfortLevel: "Стандарт",
    difficultyLevel: "Умеренная",
    language: ["Русский"],
    childrenAllowed: "От 12 лет",
    minimumAge: 12,
    groupSizeMin: 1,
    groupSizeMax: 12,
    groupSizeBucket: "До 12 человек",
    shortDescription: "Неделя в Патагонии.",
    availableDates: [],
    latitude: -50.3,
    longitude: -72.3,
    organizer: { name: "Организатор", avatar: "", slug: "org-1" },
    partnerSource: "youtravel",
    ...partial,
  };
}

describe("tour card schedule display", () => {
  it("does not render a past departure as the current offer", () => {
    const schedule = resolveTourCardScheduleDisplay(
      listing({
        availableDates: [
          { start: "2026-06-26", end: "2026-06-27", spotsLeft: 4 },
          { start: "2026-09-10", end: "2026-09-17", spotsLeft: 3 },
        ],
      }),
      new Date("2026-08-19T15:00:00-03:00"),
    );
    expect(schedule).toEqual({
      type: "dates",
      start: "2026-09-10",
      end: "2026-09-17",
      moreDates: 0,
      spotsLeft: 3,
    });
  });

  it("shows a notice when a partner tour has only past dates", () => {
    const schedule = resolveTourCardScheduleDisplay(
      listing({
        bookingMode: "scheduled",
        availableDates: [{ start: "2026-06-26", end: "2026-06-27", spotsLeft: 4 }],
      }),
      new Date("2026-08-19T15:00:00-03:00"),
    );
    expect(schedule).toEqual({ type: "notice", label: "Нет доступных дат" });
  });
});
