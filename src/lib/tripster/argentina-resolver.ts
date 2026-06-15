import type { TripsterCity, TripsterCountry } from "@/lib/tripster/types";
import { getTripsterSyncCountryMatchers } from "@/lib/tripster/env";

type TripsterFetch = <T>(path: string) => Promise<T>;

type Paginated<T> = {
  count?: number;
  next?: string | null;
  results?: T[];
};

function unwrapResults<T>(data: T[] | Paginated<T>): T[] {
  return Array.isArray(data) ? data : data.results ?? [];
}

export function matchesSyncCountry(country: TripsterCountry, matchers: string[]): boolean {
  const haystack = [country.slug, country.name_en, country.name_ru]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return matchers.some((matcher) => haystack.includes(matcher));
}

export function getSyncCountryMatchers(): string[] {
  const custom = process.env.TRIPSTER_SYNC_COUNTRY?.trim();
  if (!custom) return ["argentina", "аргентина"];

  return custom
    .toLowerCase()
    .split(/[,\s]+/)
    .filter(Boolean);
}

async function fetchAllCountries(fetch: TripsterFetch): Promise<TripsterCountry[]> {
  const collected: TripsterCountry[] = [];
  let page = 1;

  while (page <= 50) {
    const batch = await fetch<Paginated<TripsterCountry>>(`/countries/?page=${page}&page_size=100`);
    collected.push(...unwrapResults(batch));
    if (!batch.next) break;
    page += 1;
  }

  return collected;
}

async function fetchCountryByNameFilters(fetch: TripsterFetch, matchers: string[]): Promise<TripsterCountry | null> {
  const queries = new Set<string>();
  for (const matcher of matchers) {
    if (matcher.includes("argentin") || matcher.includes("аргентин")) {
      queries.add("Argentina");
      queries.add("Аргентина");
    } else {
      queries.add(matcher);
    }
  }

  for (const nameEn of queries) {
    const byEn = await fetch<Paginated<TripsterCountry>>(`/countries/?name_en=${encodeURIComponent(nameEn)}`);
    const match = unwrapResults(byEn).find((country) => matchesSyncCountry(country, matchers));
    if (match) return match;
  }

  for (const nameRu of queries) {
    const byRu = await fetch<Paginated<TripsterCountry>>(`/countries/?name_ru=${encodeURIComponent(nameRu)}`);
    const match = unwrapResults(byRu).find((country) => matchesSyncCountry(country, matchers));
    if (match) return match;
  }

  return null;
}

type SiteSearchItem = {
  id: number;
  type?: string;
  title?: string;
  slug?: string;
  url?: string;
  experience_count?: number;
  country?: { id: number; name_ru?: string; name_en?: string };
};

async function fetchCountryFromSiteSearch(fetch: TripsterFetch, matchers: string[]): Promise<TripsterCountry | null> {
  for (const query of ["Argentina", "Аргентина", ...matchers]) {
    const data = await fetch<SiteSearchItem[] | Paginated<SiteSearchItem>>(
      `/search/site/?query=${encodeURIComponent(query)}&types=country`
    );
    const items = unwrapResults(data);
    const hit = items.find((item) => item.type === "country");
    if (!hit) continue;

    return {
      id: hit.id,
      slug: hit.slug,
      name_ru: hit.title,
      name_en: hit.title,
      experience_count: hit.experience_count,
      url: hit.url,
    };
  }

  return null;
}

export async function resolveSyncCountry(fetch: TripsterFetch): Promise<TripsterCountry | null> {
  const overrideId = Number.parseInt(process.env.TRIPSTER_COUNTRY_ID?.trim() ?? "", 10);
  if (Number.isFinite(overrideId)) {
    try {
      return await fetch<TripsterCountry>(`/countries/${overrideId}/`);
    } catch {
      return { id: overrideId, name_en: "Argentina", name_ru: "Аргентина", slug: "argentina" };
    }
  }

  const matchers = getSyncCountryMatchers();

  const fromFilters = await fetchCountryByNameFilters(fetch, matchers);
  if (fromFilters) return fromFilters;

  const allCountries = await fetchAllCountries(fetch);
  const fromList = allCountries.find((country) => matchesSyncCountry(country, matchers));
  if (fromList) return fromList;

  return fetchCountryFromSiteSearch(fetch, matchers);
}

export async function resolveSyncCities(
  fetch: TripsterFetch,
  country: TripsterCountry
): Promise<TripsterCity[]> {
  const byCountry = unwrapResults(
    await fetch<TripsterCity[] | Paginated<TripsterCity>>(`/cities/?country=${country.id}&page_size=100`)
  );

  if (byCountry.length > 0) {
    return byCountry;
  }

  const cityQueries = [
    "Buenos Aires",
    "Буэнос-Айрес",
    "Bariloche",
    "San Carlos de Bariloche",
    "Барилoche",
    "Mendoza",
    "Мендоса",
    "Ushuaia",
    "Ушуая",
    "Salta",
    "Сальта",
    "Cordoba",
    "Córdoba",
    "Кордова",
    "Puerto Iguazu",
    "Puerto Iguazú",
    "Игуасу",
    "El Calafate",
    "Калафате",
    "Rosario",
    "Росario",
    "Mar del Plata",
    "Puerto Madryn",
    "Мадрин",
    "Trelew",
    "San Juan",
    "La Plata",
    "Tucuman",
    "Tucumán",
    "San Martin de los Andes",
    "Villa La Angostura",
  ];

  const cities = new Map<number, TripsterCity>();

  for (const query of cityQueries) {
    const data = await fetch<SiteSearchItem[] | Paginated<SiteSearchItem>>(
      `/search/site/?query=${encodeURIComponent(query)}&types=city`
    );

    for (const item of unwrapResults(data)) {
      if (item.type !== "city") continue;
      if (item.country?.id && item.country.id !== country.id) continue;

      cities.set(item.id, {
        id: item.id,
        slug: item.url?.split("/").filter(Boolean).pop() ?? `city-${item.id}`,
        name_ru: item.title,
        name_en: item.title,
        experience_count: item.experience_count,
        country,
      });
    }
  }

  return [...cities.values()];
}
