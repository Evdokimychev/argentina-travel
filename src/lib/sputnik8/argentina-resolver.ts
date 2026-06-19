import type { Sputnik8City, Sputnik8Country } from "@/lib/sputnik8/types";

type Sputnik8Fetch = <T>(path: string) => Promise<T>;

type Paginated<T> = {
  total?: number;
  count?: number;
  data?: T[];
  results?: T[];
  cities?: T[];
  countries?: T[];
};

function unwrapResults<T>(data: T[] | Paginated<T>): T[] {
  if (Array.isArray(data)) return data;
  return data.cities ?? data.countries ?? data.data ?? data.results ?? [];
}

export function matchesSyncCountry(country: Sputnik8Country, matchers: string[]): boolean {
  const haystack = [country.slug, country.name, country.name_en, country.name_ru]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return matchers.some((matcher) => haystack.includes(matcher));
}

export function getSyncCountryMatchers(): string[] {
  const custom = process.env.SPUTNIK8_SYNC_COUNTRY?.trim();
  if (!custom) return ["argentina", "аргентина", "argent"];

  return custom
    .toLowerCase()
    .split(/[,\s]+/)
    .filter(Boolean);
}

async function resolveCountryFromCities(
  fetch: Sputnik8Fetch
): Promise<Sputnik8Country | null> {
  const allCities = unwrapResults(
    await fetch<Sputnik8City[] | Paginated<Sputnik8City>>("/cities?limit=500")
  );

  for (const query of ARGENTINA_CITY_QUERIES) {
    const needle = query.toLowerCase();
    const city = allCities.find((item) => {
      const haystack = [item.name, item.name_en, item.name_ru, item.slug]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });

    if (!city?.country_id) continue;

    try {
      return await fetch<Sputnik8Country>(`/countries/${city.country_id}`);
    } catch {
      return {
        id: city.country_id,
        name_en: "Argentina",
        name_ru: "Аргентина",
        slug: "argentina",
      };
    }
  }

  return null;
}

async function fetchAllCountries(fetch: Sputnik8Fetch): Promise<Sputnik8Country[]> {
  const data = await fetch<Sputnik8Country[] | Paginated<Sputnik8Country>>("/countries");
  return unwrapResults(data);
}

export async function resolveSyncCountry(fetch: Sputnik8Fetch): Promise<Sputnik8Country | null> {
  const overrideId = Number.parseInt(process.env.SPUTNIK8_COUNTRY_ID?.trim() ?? "", 10);
  if (Number.isFinite(overrideId)) {
    try {
      return await fetch<Sputnik8Country>(`/countries/${overrideId}`);
    } catch {
      return { id: overrideId, name_en: "Argentina", name_ru: "Аргентина", slug: "argentina" };
    }
  }

  const matchers = getSyncCountryMatchers();
  const allCountries = await fetchAllCountries(fetch);
  const fromList = allCountries.find((country) => matchesSyncCountry(country, matchers));
  if (fromList) return fromList;

  return resolveCountryFromCities(fetch);
}

const ARGENTINA_CITY_QUERIES = [
  "Buenos Aires",
  "Буэнос-Айрес",
  "Bariloche",
  "Mendoza",
  "Мендоса",
  "Ushuaia",
  "Ушуайя",
  "Salta",
  "Cordoba",
  "Córdoba",
  "Puerto Iguazu",
  "El Calafate",
  "Rosario",
  "Mar del Plata",
  "Puerto Madryn",
];

export async function resolveSyncCities(
  fetch: Sputnik8Fetch,
  country: Sputnik8Country
): Promise<Sputnik8City[]> {
  const byCountry = unwrapResults(
    await fetch<Sputnik8City[] | Paginated<Sputnik8City>>(`/cities?country_id=${country.id}&limit=500`)
  );

  if (byCountry.length > 0) {
    return byCountry.filter((city) => !city.country_id || city.country_id === country.id);
  }

  const allCities = unwrapResults(await fetch<Sputnik8City[] | Paginated<Sputnik8City>>("/cities?limit=500"));
  const filtered = allCities.filter((city) => {
    const haystack = [city.name, city.name_en, city.name_ru, city.slug]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return (
      city.country_id === country.id ||
      ARGENTINA_CITY_QUERIES.some((query) => haystack.includes(query.toLowerCase()))
    );
  });

  return filtered;
}
