import {
  ARGENTINA_CITIES,
  ARGENTINA_MACRO_REGION_ALIASES,
  ARGENTINA_PROVINCE_ALIASES,
  type ArgentinaCity,
} from "@/data/argentina-cities";

export const ARGENTINA_COUNTRY_LABEL = "Аргентина";

const cityBySlug = new Map(ARGENTINA_CITIES.map((city) => [city.slug, city]));

const cityLookup = new Map<string, ArgentinaCity>();

for (const city of ARGENTINA_CITIES) {
  cityLookup.set(normalizeLookupKey(city.nameRu), city);
  cityLookup.set(normalizeLookupKey(city.slug), city);
  for (const alias of city.aliases) {
    cityLookup.set(normalizeLookupKey(alias), city);
  }
}

function normalizeLookupKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[–—]/g, "-");
}

export function stripCountrySuffix(label: string): string {
  return label.replace(/,\s*[^,]+$/u, "").trim();
}

function hasEmbeddedCountrySuffix(label: string): boolean {
  return /,\s*[^\s,]{2,}$/u.test(label.trim());
}

export function formatCityWithCountry(
  cityName: string,
  country: string = ARGENTINA_COUNTRY_LABEL
): string {
  const city = stripCountrySuffix(cityName.trim());
  if (!city) return country;
  if (normalizeLookupKey(city) === normalizeLookupKey(country)) return country;
  return `${city}, ${country}`;
}

export function resolveArgentinaCity(input?: string | null): ArgentinaCity | undefined {
  if (!input?.trim()) return undefined;
  const normalized = normalizeLookupKey(stripCountrySuffix(input));
  return cityLookup.get(normalized);
}

export function resolveArgentinaCityName(input?: string | null): string {
  if (!input?.trim()) return "";
  const city = resolveArgentinaCity(input);
  if (city) return city.nameRu;
  return stripCountrySuffix(input.trim());
}

export function resolveArgentinaProvinceName(input?: string | null): string {
  if (!input?.trim()) return "";
  const normalized = normalizeLookupKey(input);
  const fromAlias = ARGENTINA_PROVINCE_ALIASES[normalized];
  if (fromAlias) return fromAlias;

  const city = resolveArgentinaCity(input);
  if (city) return city.provinceRu;

  return input.trim();
}

export function resolveArgentinaMacroRegionName(input?: string | null): string {
  if (!input?.trim()) return "";
  const normalized = normalizeLookupKey(input);
  const fromAlias = ARGENTINA_MACRO_REGION_ALIASES[normalized];
  if (fromAlias) return fromAlias;

  const city = resolveArgentinaCity(input);
  if (city) return city.macroRegionRu;

  return input.trim();
}

export function getArgentinaCityBySlug(slug: string): ArgentinaCity | undefined {
  return cityBySlug.get(slug);
}

export const ARGENTINA_CITY_NAMES = ARGENTINA_CITIES.map((city) => city.nameRu).sort((a, b) =>
  a.localeCompare(b, "ru")
);

export function resolveTourCityDisplay(input: {
  destination?: string | null;
  region?: string | null;
  country?: string | null;
  cities?: string[] | null;
  mainLocation?: string | null;
}): string {
  const country = input.country?.trim() || ARGENTINA_COUNTRY_LABEL;

  const rawCandidate =
    input.destination?.trim() ||
    input.cities?.find(Boolean)?.trim() ||
    input.mainLocation?.trim() ||
    "";

  if (hasEmbeddedCountrySuffix(rawCandidate)) {
    return rawCandidate;
  }

  const cityName = resolveArgentinaCityName(rawCandidate || input.region || "");
  return formatCityWithCountry(cityName, country);
}

export function normalizeTourDestinationValue(value?: string | null): string {
  return resolveArgentinaCityName(value);
}

export function normalizeTourRegionValue(
  destination?: string | null,
  region?: string | null
): string {
  const city = resolveArgentinaCity(destination ?? region ?? "");
  if (city) return city.provinceRu;
  return resolveArgentinaProvinceName(region ?? destination ?? "");
}

/** Переводит подпись региона на русский, не меняя уровень (макрорегион остаётся макрорегионом). */
export function translateTourRegionLabel(region?: string | null): string {
  if (!region?.trim()) return "";
  const normalized = normalizeLookupKey(region);
  return (
    ARGENTINA_PROVINCE_ALIASES[normalized] ??
    ARGENTINA_MACRO_REGION_ALIASES[normalized] ??
    region.trim()
  );
}
