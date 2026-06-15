function unwrapResults(data) {
  return Array.isArray(data) ? data : data.results ?? [];
}

export function getSyncCountryMatchers() {
  const custom = process.env.TRIPSTER_SYNC_COUNTRY?.trim();
  if (!custom) return ["argentina", "аргентина"];
  return custom.toLowerCase().split(/[,\s]+/).filter(Boolean);
}

function matchesSyncCountry(country, matchers) {
  const haystack = `${country.slug ?? ""} ${country.name_en ?? ""} ${country.name_ru ?? ""}`.toLowerCase();
  return matchers.some((matcher) => haystack.includes(matcher));
}

async function fetchAllCountries(tripsterGet) {
  const collected = [];
  for (let page = 1; page <= 50; page += 1) {
    const batch = await tripsterGet(`/countries/?page=${page}&page_size=100`);
    collected.push(...unwrapResults(batch));
    if (!batch.next) break;
  }
  return collected;
}

async function fetchCountryByNameFilters(tripsterGet, matchers) {
  const queries = new Set();
  for (const matcher of matchers) {
    if (matcher.includes("argentin") || matcher.includes("аргентин")) {
      queries.add("Argentina");
      queries.add("Аргентина");
    } else {
      queries.add(matcher);
    }
  }

  for (const nameEn of queries) {
    const byEn = await tripsterGet(`/countries/?name_en=${encodeURIComponent(nameEn)}`);
    const match = unwrapResults(byEn).find((country) => matchesSyncCountry(country, matchers));
    if (match) return match;
  }

  for (const nameRu of queries) {
    const byRu = await tripsterGet(`/countries/?name_ru=${encodeURIComponent(nameRu)}`);
    const match = unwrapResults(byRu).find((country) => matchesSyncCountry(country, matchers));
    if (match) return match;
  }

  return null;
}

async function fetchCountryFromSiteSearch(tripsterGet, matchers) {
  for (const query of ["Argentina", "Аргентина", ...matchers]) {
    const data = await tripsterGet(`/search/site/?query=${encodeURIComponent(query)}&types=country`);
    const hit = unwrapResults(data).find((item) => item.type === "country");
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

export async function resolveSyncCountry(tripsterGet) {
  const overrideId = Number.parseInt(process.env.TRIPSTER_COUNTRY_ID?.trim() ?? "", 10);
  if (Number.isFinite(overrideId)) {
    try {
      return await tripsterGet(`/countries/${overrideId}/`);
    } catch {
      return { id: overrideId, name_en: "Argentina", name_ru: "Аргентина", slug: "argentina" };
    }
  }

  const matchers = getSyncCountryMatchers();
  const fromFilters = await fetchCountryByNameFilters(tripsterGet, matchers);
  if (fromFilters) return fromFilters;

  const fromList = (await fetchAllCountries(tripsterGet)).find((country) =>
    matchesSyncCountry(country, matchers)
  );
  if (fromList) return fromList;

  return fetchCountryFromSiteSearch(tripsterGet, matchers);
}

export async function resolveSyncCities(tripsterGet, country) {
  const byCountry = unwrapResults(await tripsterGet(`/cities/?country=${country.id}&page_size=100`));
  if (byCountry.length > 0) return byCountry;

  const cityQueries = [
    "Buenos Aires",
    "Буэнос-Айрес",
    "Bariloche",
    "San Carlos de Bariloche",
    "Mendoza",
    "Ushuaia",
    "Salta",
    "Cordoba",
    "Córdoba",
    "El Calafate",
    "Puerto Iguazu",
    "Puerto Iguazú",
    "Rosario",
    "Mar del Plata",
    "Puerto Madryn",
    "Trelew",
    "San Juan",
    "La Plata",
    "Tucuman",
    "San Martin de los Andes",
    "Villa La Angostura",
  ];

  const cities = new Map();
  for (const query of cityQueries) {
    const data = await tripsterGet(`/search/site/?query=${encodeURIComponent(query)}&types=city`);
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
        image: null,
      });
    }
  }

  return [...cities.values()];
}
