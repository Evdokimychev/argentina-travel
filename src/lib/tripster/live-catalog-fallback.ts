import "server-only";

import { unstable_cache } from "next/cache";
import { parseExcursionSlug } from "@/lib/excursion-slug";
import {
  fetchAllTripsterExperiences,
  fetchArgentinaCities,
  fetchTripsterExperience,
} from "@/lib/tripster/client";
import {
  cityToRow,
  experienceToListingRow,
  generateExperienceSlug,
  rowToExcursionCity,
  rowToExcursionDetail,
  rowToExcursionListing,
} from "@/lib/tripster/mapper";
import {
  partnerTourRowToDetail,
  partnerTourRowToListing,
  type PartnerTourExperienceRow,
} from "@/lib/tripster/partner-tour-mapper";
import { isPartnerTourExperiencePublishable } from "@/lib/tripster/partner-tour-visibility";
import { isTripsterTourExperience } from "@/lib/tripster/partner-tour-utils";
import type { TripsterCity, TripsterExperience } from "@/lib/tripster/types";
import type { TourDetail, TourListing } from "@/types";
import type {
  ExcursionCity,
  ExcursionDetail,
  ExcursionListFilters,
  ExcursionListResult,
  ExcursionListing,
} from "@/types/excursion";

const LIVE_CATALOG_REVALIDATE_SEC = 30 * 60;
const LIVE_CATALOG_MAX_PAGES_PER_CITY = 1;
const ARGENTINA_COUNTRY_ID = 65;

type LiveTripsterCatalog = {
  tours: TourListing[];
  excursions: ExcursionListing[];
  cities: ExcursionCity[];
};

function countryIdForCity(city: TripsterCity): number {
  return city.country?.id ?? ARGENTINA_COUNTRY_ID;
}

function toExperienceRow(experience: TripsterExperience, city: TripsterCity) {
  return experienceToListingRow(
    experience,
    countryIdForCity(city),
    city,
    generateExperienceSlug(experience.title?.trim() || `Экскурсия ${experience.id}`, experience.id),
    null,
  );
}

function dedupeExperiences(
  batches: Array<{ city: TripsterCity; experiences: TripsterExperience[] }>,
): Array<{ city: TripsterCity; experience: TripsterExperience }> {
  const byId = new Map<number, { city: TripsterCity; experience: TripsterExperience }>();

  for (const batch of batches) {
    for (const experience of batch.experiences) {
      if (!byId.has(experience.id)) {
        byId.set(experience.id, {
          city: experience.city?.id ? experience.city : batch.city,
          experience,
        });
      }
    }
  }

  return [...byId.values()];
}

async function loadLiveTripsterCatalog(): Promise<LiveTripsterCatalog> {
  const cities = await fetchArgentinaCities();
  if (cities.length === 0) {
    throw new Error("tripster_live_catalog_no_argentina_cities");
  }

  const settled = await Promise.allSettled(
    cities.map(async (city) => ({
      city,
      experiences: await fetchAllTripsterExperiences(
        { city: city.id, detailed: true, priceFormat: "detailed" },
        { maxPages: LIVE_CATALOG_MAX_PAGES_PER_CITY },
      ),
    })),
  );

  const batches = settled.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
  if (batches.length === 0) {
    throw new Error("tripster_live_catalog_all_cities_failed");
  }

  const cityExcursionCounts = new Map<number, number>();
  const tours: TourListing[] = [];
  const excursions: ExcursionListing[] = [];

  for (const { city, experience } of dedupeExperiences(batches)) {
    const row = toExperienceRow(experience, city);
    if (!isPartnerTourExperiencePublishable(row as PartnerTourExperienceRow)) continue;

    const cityRow = cityToRow(city, countryIdForCity(city));
    if (isTripsterTourExperience(row)) {
      tours.push(partnerTourRowToListing(row as PartnerTourExperienceRow, cityRow));
      continue;
    }

    excursions.push(rowToExcursionListing(row, cityRow));
    cityExcursionCounts.set(city.id, (cityExcursionCounts.get(city.id) ?? 0) + 1);
  }

  const excursionCities = cities
    .map((city) =>
      rowToExcursionCity({
        ...cityToRow(city, countryIdForCity(city)),
        experience_count: cityExcursionCounts.get(city.id) ?? 0,
      }),
    )
    .filter((city) => city.experienceCount > 0);

  if (tours.length === 0 && excursions.length === 0) {
    throw new Error("tripster_live_catalog_empty");
  }

  return { tours, excursions, cities: excursionCities };
}

const cachedLiveTripsterCatalog = unstable_cache(
  loadLiveTripsterCatalog,
  ["tripster-live-catalog-fallback-v1"],
  {
    revalidate: LIVE_CATALOG_REVALIDATE_SEC,
    tags: ["partner-tours", "excursions", "tripster-live-fallback"],
  },
);

export async function fetchLiveTripsterTourListingsFallback(): Promise<TourListing[]> {
  return (await cachedLiveTripsterCatalog()).tours;
}

function sortExcursions(
  items: ExcursionListing[],
  sort?: ExcursionListFilters["sort"],
): ExcursionListing[] {
  const sorted = [...items];
  if (sort === "rating") {
    return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }
  if (sort === "price_asc") {
    return sorted.sort(
      (a, b) => (a.priceValue ?? Number.MAX_SAFE_INTEGER) - (b.priceValue ?? Number.MAX_SAFE_INTEGER),
    );
  }
  if (sort === "price_desc") {
    return sorted.sort((a, b) => (b.priceValue ?? 0) - (a.priceValue ?? 0));
  }
  return sorted.sort((a, b) => b.reviewCount - a.reviewCount);
}

export async function fetchLiveTripsterExcursionsFallback(
  filters: ExcursionListFilters = {},
): Promise<ExcursionListResult> {
  const catalog = await cachedLiveTripsterCatalog();
  const query = filters.query?.trim().toLocaleLowerCase("ru") ?? "";
  const filtered = catalog.excursions.filter((item) => {
    if (filters.citySlug && item.citySlug !== filters.citySlug) return false;
    if (
      query &&
      !`${item.title} ${item.tagline ?? ""} ${item.cityName}`
        .toLocaleLowerCase("ru")
        .includes(query)
    ) {
      return false;
    }
    if (filters.minPrice != null && (item.priceValue ?? 0) < filters.minPrice) return false;
    if (
      filters.maxPrice != null &&
      (item.priceValue ?? Number.MAX_SAFE_INTEGER) > filters.maxPrice
    ) {
      return false;
    }
    return true;
  });
  const sorted = sortExcursions(filtered, filters.sort);
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(500, Math.max(1, filters.pageSize ?? 24));
  const from = (page - 1) * pageSize;

  return {
    items: sorted.slice(from, from + pageSize),
    total: sorted.length,
    page,
    pageSize,
    cities: catalog.cities,
  };
}

async function fetchLiveExperienceForSlug(
  slug: string,
): Promise<{ experience: TripsterExperience; city: TripsterCity } | null> {
  const parsed = parseExcursionSlug(slug);
  if (parsed?.partner !== "tripster") return null;

  const experience = await fetchTripsterExperience(parsed.id, {
    detailed: true,
    priceFormat: "detailed",
  });
  if (!experience.city?.id) return null;
  return { experience, city: experience.city };
}

export async function fetchLiveTripsterTourDetailFallback(
  slug: string,
): Promise<TourDetail | null> {
  const live = await fetchLiveExperienceForSlug(slug);
  if (!live) return null;
  const row = toExperienceRow(live.experience, live.city);
  if (!isTripsterTourExperience(row)) return null;
  if (!isPartnerTourExperiencePublishable(row as PartnerTourExperienceRow)) return null;

  return partnerTourRowToDetail(
    { ...(row as PartnerTourExperienceRow), slug },
    cityToRow(live.city, countryIdForCity(live.city)),
  );
}

export async function fetchLiveTripsterExcursionDetailFallback(
  slug: string,
): Promise<ExcursionDetail | null> {
  const live = await fetchLiveExperienceForSlug(slug);
  if (!live) return null;
  const row = toExperienceRow(live.experience, live.city);
  if (isTripsterTourExperience(row)) return null;
  if (!isPartnerTourExperiencePublishable(row as PartnerTourExperienceRow)) return null;

  return rowToExcursionDetail(
    { ...row, slug },
    cityToRow(live.city, countryIdForCity(live.city)),
  );
}

export async function fetchLiveTripsterAffiliateExperienceFallback(slug: string): Promise<{
  id: number;
  slug: string;
  tripster_url: string;
  partner_url: null;
  city_id: number;
} | null> {
  const live = await fetchLiveExperienceForSlug(slug);
  if (!live) return null;
  const row = toExperienceRow(live.experience, live.city);
  if (!isPartnerTourExperiencePublishable(row as PartnerTourExperienceRow)) return null;

  return {
    id: live.experience.id,
    slug,
    tripster_url:
      live.experience.url?.trim() ||
      `https://experience.tripster.ru/experience/${live.experience.id}/`,
    partner_url: null,
    city_id: live.city.id,
  };
}
