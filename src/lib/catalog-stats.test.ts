import { describe, expect, it } from "vitest";
import type { TourListing } from "@/types";
import {
  computeCatalogStats,
  formatCatalogBrowseHint,
  formatCatalogHeadline,
} from "@/lib/catalog-stats";
import { getMarketplaceListings } from "@/lib/tour-repository";
import { getPlatformStatsFromRepository } from "@/lib/organizer-public";

function listing(partial: Partial<TourListing> & Pick<TourListing, "id" | "slug">): TourListing {
  return {
    title: partial.title ?? partial.slug,
    shortDescription: partial.shortDescription ?? "Описание",
    gallery: partial.gallery ?? [],
    region: partial.region ?? "Патагония",
    destination: partial.destination ?? "El Calafate",
    activityType: partial.activityType ?? "nature",
    durationDays: partial.durationDays ?? 3,
    durationNights: partial.durationNights ?? 2,
    durationBucket: partial.durationBucket ?? "medium",
    priceUsd: partial.priceUsd ?? 100,
    accommodationType: partial.accommodationType ?? "hotel",
    comfortLevel: partial.comfortLevel ?? "standard",
    image: partial.image ?? "/media/placeholders/tour-card.jpg",
    ...partial,
  } as TourListing;
}

describe("catalog-stats", () => {
  it("splits native and partner tours for Argentina catalog", () => {
    const stats = computeCatalogStats([
      listing({ id: "1", slug: "native-a", country: "Аргентина" }),
      listing({ id: "2", slug: "native-b", country: "Argentina" }),
      listing({
        id: "tripster-1",
        slug: "tripster-1",
        partnerSource: "tripster",
        country: "Аргентина",
      }),
      listing({
        id: "yt-1",
        slug: "youtravel-1",
        partnerSource: "youtravel",
        country: "Argentina",
      }),
      listing({
        id: "br-1",
        slug: "brazil",
        country: "Brazil",
        title: "São Paulo city tour",
        destination: "São Paulo",
        region: "São Paulo",
        partnerSource: "tripster",
      }),
    ]);

    expect(stats).toEqual({
      nativeCount: 2,
      partnerCount: 2,
      totalCount: 4,
      organizerCount: 1,
    });
  });

  it("matches platform stats native count from repository", () => {
    const repoStats = getPlatformStatsFromRepository();
    const catalogStats = computeCatalogStats(getMarketplaceListings());
    expect(repoStats.tourCount).toBe(catalogStats.nativeCount);
    expect(repoStats.partnerTourCount).toBe(0);
    expect(repoStats.totalTourCount).toBe(catalogStats.totalCount);
  });

  it("formats headline with partner split", () => {
    expect(
      formatCatalogHeadline({
        nativeCount: 5,
        partnerCount: 41,
        totalCount: 46,
        organizerCount: 1,
      })
    ).toBe("5 туров на площадке и 41 тур партнёров");
  });

  it("formats browse hint only when partners exist", () => {
    expect(
      formatCatalogBrowseHint({
        nativeCount: 5,
        partnerCount: 0,
        totalCount: 5,
        organizerCount: 1,
      })
    ).toBeNull();
    expect(
      formatCatalogBrowseHint({
        nativeCount: 5,
        partnerCount: 11,
        totalCount: 16,
        organizerCount: 1,
      })
    ).toContain("5 туров на площадке");
  });
});
