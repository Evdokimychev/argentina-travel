import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TripsterCity, TripsterExperience } from "@/lib/tripster/types";

vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

const city: TripsterCity = {
  id: 204,
  slug: "Buenos_Aires",
  name_ru: "Буэнос-Айрес",
  experience_count: 2,
  country: { id: 65, slug: "argentina", name_ru: "Аргентина" },
};

const excursion: TripsterExperience = {
  id: 501,
  title: "Исторический центр Буэнос-Айреса",
  type: "private",
  status: "published",
  is_visible: true,
  is_bookable: true,
  duration: 3,
  review_count: 12,
  rating: 4.9,
  city,
  price: { value: 65, currency: "USD", value_string: "$65" },
  url: "https://experience.tripster.ru/experience/501/",
};

const tour: TripsterExperience = {
  id: 777,
  title: "Большое путешествие по Аргентине",
  type: "tour",
  status: "published",
  is_visible: true,
  is_bookable: true,
  duration: 312,
  review_count: 4,
  rating: 5,
  city,
  price: { value: 3200, currency: "USD", value_string: "$3200" },
  url: "https://experience.tripster.ru/experience/777/",
};

let detailExperience: TripsterExperience = excursion;

vi.mock("@/lib/tripster/client", () => ({
  fetchArgentinaCities: vi.fn(async () => [city]),
  fetchAllTripsterExperiences: vi.fn(async () => [excursion, tour]),
  fetchTripsterExperience: vi.fn(async () => detailExperience),
}));

import {
  fetchLiveTripsterAffiliateExperienceFallback,
  fetchLiveTripsterExcursionDetailFallback,
  fetchLiveTripsterExcursionsFallback,
  fetchLiveTripsterTourDetailFallback,
  fetchLiveTripsterTourListingsFallback,
} from "@/lib/tripster/live-catalog-fallback";

describe("Tripster live catalog fallback", () => {
  beforeEach(() => {
    detailExperience = excursion;
  });

  it("keeps tours and excursions separated and preserves real partner ids", async () => {
    const tours = await fetchLiveTripsterTourListingsFallback();
    const excursions = await fetchLiveTripsterExcursionsFallback({ pageSize: 50 });

    expect(tours).toHaveLength(1);
    expect(tours[0]).toMatchObject({
      id: "tripster-777",
      partnerSource: "tripster",
      destination: "Буэнос-Айрес",
    });
    expect(excursions.items).toHaveLength(1);
    expect(excursions.items[0]).toMatchObject({
      id: 501,
      partner: "tripster",
      citySlug: "Buenos_Aires",
    });
  });

  it("applies customer filters after loading the shared live snapshot", async () => {
    const found = await fetchLiveTripsterExcursionsFallback({ query: "исторический" });
    const missing = await fetchLiveTripsterExcursionsFallback({ query: "патагония" });

    expect(found.total).toBe(1);
    expect(missing.total).toBe(0);
    expect(found.cities[0]?.experienceCount).toBe(1);
  });

  it("resolves live excursion detail and an affiliate-safe source record", async () => {
    const detail = await fetchLiveTripsterExcursionDetailFallback(
      "istoricheskiy-tsentr-buenos-ayresa-t501",
    );
    const affiliate = await fetchLiveTripsterAffiliateExperienceFallback(
      "istoricheskiy-tsentr-buenos-ayresa-t501",
    );

    expect(detail).toMatchObject({ id: 501, partner: "tripster" });
    expect(affiliate).toEqual({
      id: 501,
      slug: "istoricheskiy-tsentr-buenos-ayresa-t501",
      tripster_url: "https://experience.tripster.ru/experience/501/",
      partner_url: null,
      city_id: 204,
    });
  });

  it("resolves a live tour detail only for a tour payload", async () => {
    detailExperience = tour;

    const detail = await fetchLiveTripsterTourDetailFallback(
      "bolshoe-puteshestvie-po-argentine-t777",
    );

    expect(detail).toMatchObject({
      id: "tripster-777",
      slug: "bolshoe-puteshestvie-po-argentine-t777",
      partnerSource: "tripster",
      partnerExperienceId: 777,
    });
  });
});
