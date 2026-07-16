import { describe, expect, it } from "vitest";
import type { TourListing } from "@/types";
import {
  assessTourForPodborBudget,
  resolvePodborBudgetRange,
} from "@/lib/podbor/budget";
import { buildPodborMatchResult } from "@/lib/podbor/matching";
import { parseTourMatchIntent, rankToursForIntent } from "@/lib/ai/tour-matcher";

function makeTour(priceUsd: number, overrides: Partial<TourListing> = {}): TourListing {
  return {
    id: `tour-${priceUsd}`,
    slug: `patagonia-${priceUsd}`,
    title: `Патагония ${priceUsd}`,
    shortDescription: "Ледники и горы Патагонии",
    image: "/media/placeholders/tour-card.jpg",
    gallery: [],
    destination: "Эль-Калафате",
    region: "Патагония",
    activityType: "Авторские туры",
    durationDays: 7,
    durationNights: 6,
    durationBucket: "4–7 дней",
    priceUsd,
    accommodationType: "Отель",
    comfortLevel: "Стандарт",
    difficultyLevel: "Умеренная",
    language: ["Русский"],
    childrenAllowed: "От 5 лет",
    minimumAge: 5,
    groupSizeMin: 1,
    groupSizeMax: 8,
    groupSizeBucket: "До 8 человек",
    bookingMode: "scheduled",
    availableDates: [],
    latitude: -50.3,
    longitude: -72.3,
    rating: 4.8,
    reviewCount: 12,
    organizer: { name: "Гид", avatar: "" },
    badges: [],
    ...overrides,
  };
}

describe("podbor strict budget", () => {
  it("keeps budget boundaries non-overlapping", () => {
    expect(resolvePodborBudgetRange("1000-2000")).toEqual([1001, 2000]);
    expect(resolvePodborBudgetRange("2000-5000")).toEqual([2001, 5000]);
  });

  it("accepts exactly 2000 USD and rejects 2001 USD", () => {
    expect(assessTourForPodborBudget(makeTour(2000), 2000).status).toBe("within_budget");
    expect(assessTourForPodborBudget(makeTour(2001), 2000)).toMatchObject({
      status: "over_budget",
      overageUsd: 1,
    });
  });

  it("never mixes an over-budget tour into the main podbor results", () => {
    const result = buildPodborMatchResult(
      {
        goal: ["expedition"],
        focus: ["nature"],
        duration: ["7-10"],
        budget: ["1000-2000"],
      },
      [makeTour(2000), makeTour(2001)]
    );

    expect(result.tours.map((tour) => tour.priceUsd)).toEqual([2000]);
    expect(result.overBudgetTours.map((item) => item.normalizedTotalUsd)).toEqual([2001]);
  });

  it("keeps unknown prices out of exact matches", () => {
    const result = buildPodborMatchResult(
      { goal: ["expedition"], budget: ["1000-2000"] },
      [makeTour(0, { priceOnRequest: true })]
    );

    expect(result.tours).toHaveLength(0);
    expect(result.priceUnknownTourCount).toBe(1);
  });

  it("applies the same strict boundary to text recommendations", () => {
    const intent = parseTourMatchIntent("Патагония, бюджет до 2000 долларов");
    const ranked = rankToursForIntent([makeTour(2000), makeTour(2001)], intent);

    expect(ranked.map((item) => item.tour.priceUsd)).toEqual([2000]);
  });

  it.each([1, 2, 4])("checks tour capacity for a party of %i", (partySize) => {
    const intent = parseTourMatchIntent(`Патагония, ${partySize} человек, бюджет до 2000 долларов`);
    const tooSmall = makeTour(1500, { id: "too-small", slug: "too-small", groupSizeMin: partySize + 1 });
    const matching = makeTour(1500, { id: "matching", slug: "matching", groupSizeMin: 1, groupSizeMax: partySize });

    expect(rankToursForIntent([tooSmall, matching], intent).map((item) => item.tour.slug)).toEqual([
      "matching",
    ]);
  });

  it("normalizes a per-group price to the selected party size", () => {
    const groupTour = makeTour(4000, { partnerPriceUnit: "per_group" });

    expect(assessTourForPodborBudget(groupTour, 2000, 2)).toMatchObject({
      status: "within_budget",
      normalizedTotalUsd: 2000,
    });
  });
});
