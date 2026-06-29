import { describe, expect, it } from "vitest";
import type { TourListing } from "@/types";
import {
  filterDefaultCatalogTours,
  filterNeighboringCountryTours,
  getTourPrimaryCountry,
  isDefaultCatalogTour,
  isNeighboringCountryTour,
  matchesCatalogCountryScope,
} from "@/lib/catalog-country-relevance";
import { getMarketplaceListings } from "@/lib/tour-repository";

function listing(partial: Partial<TourListing> & Pick<TourListing, "id" | "slug">): TourListing {
  return {
    title: partial.title ?? partial.slug,
    shortDescription: partial.shortDescription ?? "Описание",
    gallery: partial.gallery ?? [],
    destination: partial.destination ?? "El Calafate",
    region: partial.region ?? "Патагония",
    activityType: partial.activityType ?? "nature",
    durationDays: partial.durationDays ?? 3,
    durationNights: partial.durationNights ?? 2,
    durationBucket: partial.durationBucket ?? "medium",
    priceUsd: partial.priceUsd ?? 100,
    accommodationType: partial.accommodationType ?? "hotel",
    comfortLevel: partial.comfortLevel ?? "standard",
    image: partial.image ?? "/media/placeholders/tour-card.jpg",
    availableDates: partial.availableDates ?? [],
    difficultyLevel: partial.difficultyLevel ?? "medium",
    language: partial.language ?? ["ru"],
    minimumAge: partial.minimumAge ?? 0,
    groupSizeBucket: partial.groupSizeBucket ?? "small",
    latitude: partial.latitude ?? -50,
    longitude: partial.longitude ?? -70,
    organizer: partial.organizer ?? { slug: "org", name: "Org" },
    ...partial,
  } as TourListing;
}

describe("catalog-country-relevance", () => {
  it("resolves primary country from comma-separated label", () => {
    expect(getTourPrimaryCountry(listing({ id: "1", slug: "a", country: "Brazil, Argentina" }))).toBe(
      "Brazil"
    );
  });

  it("includes Argentina-native and cross-border Iguazu from Brazil", () => {
    expect(
      isDefaultCatalogTour(
        listing({
          id: "ar-1",
          slug: "patagonia",
          country: "Аргентина",
          partnerSource: "tripster",
        })
      )
    ).toBe(true);

    expect(
      isDefaultCatalogTour(
        listing({
          id: "br-iguazu",
          slug: "foz-iguazu",
          country: "Бразилия",
          title: "Водопады Игуасu с бrazilian side",
          destination: "Foz do Iguaçu",
          partnerSource: "tripster",
        })
      )
    ).toBe(true);
  });

  it("excludes pure Brazil/Paraguay tours from default catalog", () => {
    const rio = listing({
      id: "br-rio",
      slug: "rio-carnival",
      country: "Brazil",
      title: "Карнавал в Рио-де-Жанейро",
      destination: "Rio de Janeiro",
      region: "Rio de Janeiro",
      partnerSource: "tripster",
    });
    const paraguay = listing({
      id: "py-1",
      slug: "asuncion",
      country: "Paraguay",
      title: "Асунсьон и окрестности",
      destination: "Asunción",
      region: "Asunción",
      partnerSource: "youtravel",
    });

    expect(isDefaultCatalogTour(rio)).toBe(false);
    expect(isDefaultCatalogTour(paraguay)).toBe(false);
    expect(isNeighboringCountryTour(rio)).toBe(true);
    expect(isNeighboringCountryTour(paraguay)).toBe(true);
  });

  it("default catalog filter excludes Brazil/Paraguay-primary tours", () => {
    const tours = [
      listing({ id: "1", slug: "ar", country: "Argentina" }),
      listing({
        id: "2",
        slug: "br",
        country: "Brazil",
        title: "São Paulo city tour",
        destination: "São Paulo",
        partnerSource: "tripster",
      }),
      listing({
        id: "3",
        slug: "py",
        country: "Paraguay",
        title: "Asunción",
        destination: "Asunción",
        partnerSource: "tripster",
      }),
      listing({
        id: "4",
        slug: "iguazu",
        country: "Brazil",
        title: "Iguazu falls day trip",
        destination: "Foz do Iguaçu",
        partnerSource: "tripster",
      }),
    ];

    const defaultCatalog = filterDefaultCatalogTours(tours);
    expect(defaultCatalog.map((t) => t.slug)).toEqual(["ar", "iguazu"]);
    expect(filterNeighboringCountryTours(tours).map((t) => t.slug)).toEqual(["br", "py"]);
  });

  it("matchesCatalogCountryScope respects neighboring opt-in", () => {
    const rio = listing({
      id: "br-rio",
      slug: "rio",
      country: "Brazil",
      title: "Rio beach",
      destination: "Rio",
      partnerSource: "tripster",
    });

    expect(matchesCatalogCountryScope(rio, false)).toBe(false);
    expect(matchesCatalogCountryScope(rio, true)).toBe(true);
  });

  it("repository seed listings stay in default catalog", () => {
    const defaults = filterDefaultCatalogTours(getMarketplaceListings());
    expect(defaults.length).toBe(getMarketplaceListings().length);
    for (const tour of defaults) {
      const primary = getTourPrimaryCountry(tour)?.toLowerCase() ?? "";
      expect(primary.includes("brazil") || primary.includes("бразил")).toBe(false);
      expect(primary.includes("paraguay") || primary.includes("парагв")).toBe(false);
    }
  });
});
