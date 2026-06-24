import { describe, expect, it } from "vitest";
import {
  buildYouTravelTourDetailItems,
  listYouTravelUpcomingDepartureDates,
  resolveYouTravelDepartureCapacity,
  resolveYouTravelInstantBooking,
  resolveYouTravelReferenceDate,
  resolveYouTravelTourGuaranteed,
  resolveYouTravelTourTypeTags,
  resolveYouTravelTravelersGoing,
  resolveYouTravelTravelersGoingForDate,
} from "@/lib/youtravel/partner-tour-details";
import type { TourDatePrice } from "@/types";
import type { PartnerTourContent } from "@/lib/tripster/partner-tour-content";
import type { YouTravelTour } from "@/lib/youtravel/types";

describe("resolveYouTravelInstantBooking", () => {
  it("reads instant booking from payload and serp", () => {
    expect(resolveYouTravelInstantBooking({ instant_booking: true })).toBe(true);
    expect(
      resolveYouTravelInstantBooking({ serp: { is_instant: 1 } } as unknown as YouTravelTour),
    ).toBe(true);
    expect(resolveYouTravelInstantBooking({})).toBe(false);
  });
});

describe("resolveYouTravelTourGuaranteed", () => {
  it("reads guarantee flag from payload and serp", () => {
    expect(resolveYouTravelTourGuaranteed({ tour_guaranteed: true })).toBe(true);
    expect(
      resolveYouTravelTourGuaranteed({ serp: { is_guarantee: "1" } } as unknown as YouTravelTour),
    ).toBe(true);
    expect(resolveYouTravelTourGuaranteed({})).toBe(false);
  });
});

describe("resolveYouTravelTravelersGoing", () => {
  it("reads explicit payload counter", () => {
    expect(resolveYouTravelTravelersGoing({ travelers_going: 10 })).toBe(10);
  });

  it("derives booked seats from offer capacity", () => {
    expect(
      resolveYouTravelTravelersGoing({}, [
        { seatsTotal: 16, freeSpaces: 6 },
      ]),
    ).toBe(10);
  });
});

describe("resolveYouTravelReferenceDate", () => {
  const dates: TourDatePrice[] = [
    {
      id: "past",
      startDate: "2024-01-10",
      endDate: "2024-01-20",
      spotsLeft: 5,
      priceUsd: 1000,
    },
    {
      id: "near",
      startDate: "2026-07-01",
      endDate: "2026-07-13",
      spotsLeft: 3,
      priceUsd: 1200,
      travelersGoingCount: 5,
    },
    {
      id: "later",
      startDate: "2026-08-01",
      endDate: "2026-08-13",
      spotsLeft: 10,
      priceUsd: 1300,
      travelersGoingCount: 2,
    },
  ];

  it("prefers explicitly selected date", () => {
    expect(resolveYouTravelReferenceDate(dates, "later")?.id).toBe("later");
  });

  it("defaults to nearest upcoming date", () => {
    expect(resolveYouTravelReferenceDate(dates)?.id).toBe("near");
  });
});

describe("listYouTravelUpcomingDepartureDates", () => {
  it("returns only future dates sorted by start", () => {
    const dates: TourDatePrice[] = [
      {
        id: "later",
        startDate: "2027-04-01",
        endDate: "2027-04-13",
        spotsLeft: 5,
        priceUsd: 1000,
      },
      {
        id: "past",
        startDate: "2024-01-01",
        endDate: "2024-01-10",
        spotsLeft: 5,
        priceUsd: 1000,
      },
      {
        id: "near",
        startDate: "2027-03-16",
        endDate: "2027-03-29",
        spotsLeft: 3,
        priceUsd: 1200,
      },
    ];

    expect(listYouTravelUpcomingDepartureDates(dates).map((date) => date.id)).toEqual([
      "near",
      "later",
    ]);
  });
});

describe("resolveYouTravelTravelersGoingForDate", () => {
  it("uses per-date counter when available", () => {
    expect(
      resolveYouTravelTravelersGoingForDate(
        { groupMax: 14 },
        {
          id: "d1",
          startDate: "2026-07-01",
          endDate: "2026-07-13",
          spotsLeft: 9,
          priceUsd: 1000,
          travelersGoingCount: 5,
        },
      ),
    ).toBe(5);
  });

  it("estimates from spots left when counter is missing", () => {
    expect(
      resolveYouTravelTravelersGoingForDate(
        { groupMax: 14 },
        {
          id: "d1",
          startDate: "2026-07-01",
          endDate: "2026-07-13",
          spotsLeft: 9,
          priceUsd: 1000,
        },
      ),
    ).toBe(5);
  });
});

describe("resolveYouTravelDepartureCapacity", () => {
  it("derives booked and free from seats total and explicit counter", () => {
    expect(
      resolveYouTravelDepartureCapacity(
        { groupMax: 20 },
        {
          id: "d1",
          startDate: "2026-07-01",
          endDate: "2026-07-13",
          spotsLeft: 9,
          seatsTotal: 14,
          priceUsd: 1000,
          travelersGoingCount: 5,
        },
      ),
    ).toEqual({ total: 14, booked: 5, free: 9 });
  });

  it("falls back to tour group max when offer total is missing", () => {
    expect(
      resolveYouTravelDepartureCapacity(
        { groupMax: 14 },
        {
          id: "d1",
          startDate: "2026-07-01",
          endDate: "2026-07-13",
          spotsLeft: 9,
          priceUsd: 1000,
        },
      ),
    ).toEqual({ total: 14, booked: 5, free: 9 });
  });
});

describe("buildYouTravelTourDetailItems", () => {
  const content: PartnerTourContent = {
    blocks: [],
    format: "Тур в горы",
    comfortLabel: "Высокий",
    activityLabel: "Умеренная",
    languages: ["English", "Russian"],
    childrenSummary: "8–75 лет",
  };

  it("builds YouTravel-style detail rows without comfort and activity", () => {
    const items = buildYouTravelTourDetailItems({
      tour: { durationDays: 13 },
      content,
    });

    expect(items.map((item) => item.label)).toEqual([
      "Дней",
      "Язык тура",
      "Возраст группы",
    ]);
    expect(items.find((item) => item.id === "comfort")).toBeUndefined();
    expect(items.find((item) => item.id === "activity")).toBeUndefined();
    expect(items.find((item) => item.id === "languages")?.value).toBe("Английский, Русский");
    expect(items.find((item) => item.id === "age")?.value).toBe("8–75");
  });
});

describe("resolveYouTravelTourTypeTags", () => {
  it("puts main listing tag first and expands format labels", () => {
    expect(
      resolveYouTravelTourTypeTags(
        { partnerThematicTags: ["Авторский", "Гастрономический"] },
        {
          format:
            "Авторский, Гастрономический, Экскурсионный, На море, Водный тур, Для соло путешественников",
        },
      ),
    ).toEqual([
      "Авторский",
      "Гастрономический",
      "Экскурсионный",
      "На море",
      "Водный тур",
      "Для соло путешественников",
    ]);
  });
});
