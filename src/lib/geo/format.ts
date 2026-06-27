import { getAirportByIata, getCountryFlag } from "./airports";
import { resolveLocation, resolveMacroRegion } from "./locations";
import type { GeoCountryCode, GeoLocation, TourLocationInput } from "./types";

const ARGENTINA_COUNTRY_LABEL = "Аргентина";

function stripCountrySuffix(label: string): string {
  return label.replace(/,\s*[^,]+$/u, "").trim();
}

function formatCityWithCountry(cityName: string, country: string = ARGENTINA_COUNTRY_LABEL): string {
  const city = stripCountrySuffix(cityName.trim());
  if (!city) return country;
  if (city.toLowerCase() === country.toLowerCase()) return country;
  return `${city}, ${country}`;
}

export type AirportPickerLine = {
  cityLine: string;
  airportLine: string;
};

export function formatAirportPickerLine(
  city: string,
  country: string,
  airportName: string,
  iata: string,
  flag?: string,
): AirportPickerLine {
  const flagSuffix = flag ? ` ${flag}` : "";
  return {
    cityLine: `${city}, ${country}${flagSuffix}`,
    airportLine: `${airportName} (${iata})`,
  };
}

export function formatAirportPickerFromIata(iata: string): AirportPickerLine {
  const normalized = iata.trim().toUpperCase();
  const airport = getAirportByIata(normalized);

  if (!airport) {
    return {
      cityLine: normalized,
      airportLine: normalized,
    };
  }

  if (normalized === "BUE") {
    return formatAirportPickerLine(
      airport.cityRu,
      airport.countryRu,
      "Все аэропорты",
      normalized,
      getCountryFlag(airport.countryCode),
    );
  }

  return formatAirportPickerLine(
    airport.cityRu,
    airport.countryRu,
    airport.nameRu,
    airport.iata,
    getCountryFlag(airport.countryCode),
  );
}

const PATAGONIA_CITY_SLUGS = new Set([
  "bariloche",
  "el-calafate",
  "ushuaia",
  "puerto-madryn",
  "trelew",
  "el-chalten",
  "san-martin-de-los-andes",
  "viedma",
  "rio-gallegos",
  "rio-grande",
  "comodoro-rivadavia",
  "neuquen",
]);

function collectLocationNames(input: TourLocationInput): string[] {
  const names: string[] = [];
  const push = (value?: string | null) => {
    const trimmed = value?.trim();
    if (trimmed) names.push(trimmed);
  };

  push(input.destination);
  push(input.mainLocation);
  push(input.region);
  if (input.cities?.length) {
    for (const city of input.cities) push(city);
  }

  return names;
}

function resolveUniqueLocations(input: TourLocationInput): GeoLocation[] {
  const seen = new Set<string>();
  const resolved: GeoLocation[] = [];

  for (const name of collectLocationNames(input)) {
    const loc = resolveLocation(name);
    if (!loc || seen.has(loc.id)) continue;
    seen.add(loc.id);
    resolved.push(loc);
  }

  return resolved;
}

export function resolveTourPrimaryLocation(input: TourLocationInput): {
  primary: string;
  country: string;
  locationCount: number;
  macroRegion?: string;
} {
  const country = input.country?.trim() || "Аргентина";
  const locations = resolveUniqueLocations(input);
  const macroFromRegion = resolveMacroRegion(input.region);
  const macroFromTitle = input.title ? resolveMacroRegion(input.title) : undefined;
  const macroRegion = macroFromRegion ?? macroFromTitle;

  const cityLocations = locations.filter((loc) => loc.type === "city");
  const locationCount = cityLocations.length > 0 ? cityLocations.length : locations.length;

  const patagoniaLocations = locations.filter(
    (loc) =>
      loc.macroRegionRu === "Патагония" ||
      (loc.type === "city" && PATAGONIA_CITY_SLUGS.has(loc.slug)),
  );
  const patagoniaCityLocations = patagoniaLocations.filter((loc) => loc.type === "city");

  if (macroRegion === "Патагония" || patagoniaCityLocations.length >= 2) {
    return {
      primary: "Патагония",
      country,
      locationCount: Math.max(locationCount, patagoniaCityLocations.length, 2),
      macroRegion: "Патагония",
    };
  }

  if (locationCount > 1 && macroRegion) {
    return {
      primary: macroRegion,
      country,
      locationCount,
      macroRegion,
    };
  }

  if (cityLocations.length === 1) {
    return {
      primary: cityLocations[0].nameRu,
      country,
      locationCount: 1,
      macroRegion: cityLocations[0].macroRegionRu ?? macroRegion,
    };
  }

  if (locations.length === 1) {
    return {
      primary: locations[0].nameRu,
      country,
      locationCount: 1,
      macroRegion: locations[0].macroRegionRu ?? macroRegion,
    };
  }

  const rawCandidate =
    input.destination?.trim() ||
    input.mainLocation?.trim() ||
    input.cities?.find(Boolean)?.trim() ||
    input.region?.trim() ||
    "";

  if (rawCandidate && /,\s*[^\s,]{2,}$/u.test(rawCandidate)) {
    return {
      primary: stripCountrySuffix(rawCandidate),
      country,
      locationCount: 1,
    };
  }

  const resolvedName = resolveLocation(rawCandidate)?.nameRu ?? stripCountrySuffix(rawCandidate);
  const primary = macroRegion && !resolvedName ? macroRegion : resolvedName || macroRegion || country;

  return {
    primary,
    country,
    locationCount: locations.length || (primary ? 1 : 0),
    macroRegion,
  };
}

export function formatTourLocationCompact(input: TourLocationInput): string {
  const { primary, country, locationCount } = resolveTourPrimaryLocation(input);

  if (!primary) return "📍 Аргентина";

  const locationWord =
    locationCount % 10 === 1 && locationCount % 100 !== 11
      ? "локация"
      : locationCount % 10 >= 2 &&
          locationCount % 10 <= 4 &&
          (locationCount % 100 < 10 || locationCount % 100 >= 20)
        ? "локации"
        : "локаций";

  const label =
    locationCount > 1
      ? `${primary} · ${locationCount} ${locationWord}`
      : formatCityWithCountry(primary, country);

  return `📍 ${label}`;
}

export function formatTourLocationCompactPlain(input: TourLocationInput): string {
  return formatTourLocationCompact(input).replace(/^📍\s*/, "");
}

export function formatHubDisplayLines(iata: string): AirportPickerLine {
  return formatAirportPickerFromIata(iata);
}

export function countryCodeFromLabel(country?: string | null): GeoCountryCode | undefined {
  const normalized = country?.trim().toLowerCase();
  if (!normalized) return undefined;
  if (normalized.includes("аргент")) return "AR";
  if (normalized.includes("бразил")) return "BR";
  if (normalized.includes("росс")) return "RU";
  if (normalized.includes("чили")) return "CL";
  if (normalized.includes("перу")) return "PE";
  return undefined;
}
