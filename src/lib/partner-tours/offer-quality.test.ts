import { describe, expect, it } from "vitest";
import {
  evaluateOfferQuality,
  filterBookableMarketplaceListings,
  filterFutureTourDates,
} from "@/lib/partner-tours/offer-quality";
import { classifyFeedFreshness } from "@/lib/partner-tours/freshness";
import { assessPartnerContentQuality } from "@/lib/partner-tours/content-quality";
import type { TourListing } from "@/types";

function listing(partial: Partial<TourListing> & Pick<TourListing, "id" | "slug">): TourListing {
  return {
    title: "Тур по Патагонии",
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
    shortDescription: "Неделя в Патагонии с треккингом и ледниками.",
    availableDates: [],
    latitude: -50.3,
    longitude: -72.3,
    organizer: {
      name: "Организатор",
      avatar: "",
      slug: "org-1",
    },
    partnerSource: "youtravel",
    partnerPriceCurrency: "USD",
    partnerPriceValue: 1200,
    ...partial,
  };
}

describe("partner calendar / future dates", () => {
  it("drops past departures from catalog dates", () => {
    const now = new Date("2026-08-17T15:00:00-03:00");
    const kept = filterFutureTourDates(
      [
        { start: "2026-08-10", end: "2026-08-16", spotsLeft: 3 },
        { start: "2026-09-01", end: "2026-09-08", spotsLeft: 2 },
      ],
      now,
    );
    expect(kept).toEqual([{ start: "2026-09-01", end: "2026-09-08", spotsLeft: 2 }]);
  });
});

describe("offer quality gate", () => {
  it("rejects impossible prices and keeps identity", () => {
    const decision = evaluateOfferQuality({
      listing: listing({ id: "youtravel-1", slug: "patagonia-yt1", priceUsd: 0 }),
      now: new Date("2026-08-17T12:00:00Z"),
    });
    expect(decision.state).toBe("rejected");
    expect(decision.reasons).toContain("INVALID_PRICE");
    expect(decision.showAsBookable).toBe(false);
  });

  it("hides past-only departures from bookable catalog", () => {
    const decision = evaluateOfferQuality({
      listing: listing({
        id: "youtravel-2",
        slug: "patagonia-yt2",
        availableDates: [{ start: "2026-01-01", end: "2026-01-08", spotsLeft: 4 }],
      }),
      now: new Date("2026-08-17T12:00:00Z"),
    });
    expect(decision.reasons).toContain("PAST_DEPARTURES_ONLY");
    expect(decision.showAsBookable).toBe(false);
    expect(decision.allowDetailPage).toBe(true);
  });

  it("keeps tours without known schedule as degraded discoverable cards", () => {
    const decision = evaluateOfferQuality({
      listing: listing({ id: "tripster-9", slug: "iguazu-t9", partnerSource: "tripster" }),
      now: new Date("2026-08-17T12:00:00Z"),
    });
    expect(decision.reasons).toContain("NO_BOOKABLE_DEPARTURE");
    expect(decision.state).toBe("degraded");
    expect(decision.showAsBookable).toBe(true);
  });

  it("filters bookable marketplace listings", () => {
    const now = new Date("2026-08-17T12:00:00Z");
    const result = filterBookableMarketplaceListings(
      [
        listing({
          id: "youtravel-ok",
          slug: "ok-yt1",
          availableDates: [{ start: "2026-09-01", end: "2026-09-08", spotsLeft: 2 }],
        }),
        listing({
          id: "youtravel-past",
          slug: "past-yt2",
          availableDates: [{ start: "2026-01-01", end: "2026-01-08", spotsLeft: 2 }],
        }),
        listing({
          id: "platform-1",
          slug: "platform-patagonia",
          partnerSource: undefined,
          availableDates: [{ start: "2026-01-01", end: "2026-01-08", spotsLeft: 2 }],
        }),
      ],
      { now },
    );
    expect(result.map((row) => row.slug)).toEqual(["ok-yt1", "platform-patagonia"]);
    expect(result[0]?.availableDates[0]?.start).toBe("2026-09-01");
  });

  it("classifies neighboring-only partner tours as irrelevant for default catalog", () => {
    const decision = evaluateOfferQuality({
      listing: listing({
        id: "youtravel-rio",
        slug: "rio-yt3",
        country: "Бразилия",
        destination: "Рио-де-Жанейро",
        title: "Карнавал в Рио",
        shortDescription: "Карнавал и пляжи Копакабаны",
        availableDates: [{ start: "2026-09-01", end: "2026-09-08", spotsLeft: 2 }],
      }),
      now: new Date("2026-08-17T12:00:00Z"),
    });
    expect(decision.taxonomy).toBe("south_america_other");
    expect(decision.reasons).toContain("IRRELEVANT_DESTINATION");
    expect(decision.showAsBookable).toBe(false);
  });

  it("rejects unsafe booking targets", () => {
    const decision = evaluateOfferQuality({
      listing: listing({
        id: "youtravel-pay",
        slug: "pay-yt4",
        availableDates: [{ start: "2026-09-01", end: "2026-09-08", spotsLeft: 2 }],
      }),
      bookingTargetUrl: "https://youtravel.me/lk/pay/123",
      now: new Date("2026-08-17T12:00:00Z"),
    });
    expect(decision.reasons).toContain("BROKEN_BOOKING_TARGET");
    expect(decision.showAsBookable).toBe(false);
  });
});

describe("feed freshness", () => {
  it("marks critical staleness after a week", () => {
    expect(
      classifyFeedFreshness({
        syncedAt: "2026-08-01T00:00:00.000Z",
        now: new Date("2026-08-17T00:00:00.000Z"),
      }),
    ).toBe("critical");
  });
});

describe("partner content quality", () => {
  it("flags script injection and accepts clean Russian", () => {
    expect(assessPartnerContentQuality("<script>alert(1)</script>").ok).toBe(false);
    const good = assessPartnerContentQuality(
      "Недельный маршрут по Патагонии включает треккинг к леднику Перито-Морено и прогулки вокруг озера Архентино.",
    );
    expect(good.ok).toBe(true);
  });
});
