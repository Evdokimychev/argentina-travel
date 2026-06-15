function unwrapResults(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.cities ?? data.countries ?? data.products ?? data.data ?? data.results ?? [];
}

export function getSyncCountryMatchers() {
  const custom = process.env.SPUTNIK8_SYNC_COUNTRY?.trim();
  if (!custom) return ["argentina", "аргентина", "argent"];
  return custom.toLowerCase().split(/[,\s]+/).filter(Boolean);
}

const ARGENTINA_CITY_QUERIES = [
  "Buenos Aires",
  "Буэнос-Айрес",
  "Bariloche",
  "Mendoza",
  "Ushuaia",
  "Salta",
  "Cordoba",
  "Córdoba",
  "El Calafate",
  "Puerto Iguazu",
  "Rosario",
  "Mar del Plata",
  "Puerto Madryn",
];

async function resolveCountryFromCities(sputnik8Get) {
  const allCities = unwrapResults(await sputnik8Get("/cities?limit=500"));

  for (const query of ARGENTINA_CITY_QUERIES) {
    const needle = query.toLowerCase();
    const city = allCities.find((item) => {
      const haystack = `${item.name ?? ""} ${item.name_en ?? ""} ${item.name_ru ?? ""} ${item.slug ?? ""}`.toLowerCase();
      return haystack.includes(needle);
    });

    if (!city?.country_id) continue;

    try {
      return await sputnik8Get(`/countries/${city.country_id}`);
    } catch {
      return { id: city.country_id, name_en: "Argentina", name_ru: "Аргентина", slug: "argentina" };
    }
  }

  return null;
}

function matchesSyncCountry(country, matchers) {
  const haystack = `${country.slug ?? ""} ${country.name ?? ""} ${country.name_en ?? ""} ${country.name_ru ?? ""}`.toLowerCase();
  return matchers.some((matcher) => haystack.includes(matcher));
}

async function fetchAllCountries(sputnik8Get) {
  const data = await sputnik8Get("/countries");
  return unwrapResults(data);
}

export async function resolveSyncCountry(sputnik8Get) {
  const overrideId = Number.parseInt(process.env.SPUTNIK8_COUNTRY_ID?.trim() ?? "", 10);
  if (Number.isFinite(overrideId)) {
    try {
      return await sputnik8Get(`/countries/${overrideId}`);
    } catch {
      return { id: overrideId, name_en: "Argentina", name_ru: "Аргентина", slug: "argentina" };
    }
  }

  const matchers = getSyncCountryMatchers();
  const allCountries = await fetchAllCountries(sputnik8Get);
  const fromList = allCountries.find((country) => matchesSyncCountry(country, matchers));
  if (fromList) return fromList;

  return resolveCountryFromCities(sputnik8Get);
}

export async function resolveSyncCities(sputnik8Get, country) {
  const byCountry = unwrapResults(await sputnik8Get(`/cities?country_id=${country.id}&limit=500`));
  if (byCountry.length > 0) {
    return byCountry.filter((city) => !city.country_id || city.country_id === country.id);
  }

  const allCities = unwrapResults(await sputnik8Get("/cities?limit=500"));
  return allCities.filter((city) => {
    const haystack = `${city.name ?? ""} ${city.name_en ?? ""} ${city.name_ru ?? ""} ${city.slug ?? ""}`.toLowerCase();
    return (
      city.country_id === country.id ||
      ARGENTINA_CITY_QUERIES.some((query) => haystack.includes(query.toLowerCase()))
    );
  });
}
