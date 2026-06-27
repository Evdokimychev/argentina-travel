import {
  ARGENTINA_CITIES,
  ARGENTINA_MACRO_REGION_ALIASES,
  type ArgentinaCity,
} from "@/data/argentina-cities";
import type { GeoCountryCode, GeoLocation, GeoLocationType } from "./types";

const ARGENTINA_COUNTRY_RU = "Аргентина";

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[–—]/g, "-");
}

function cityToGeoLocation(city: ArgentinaCity): GeoLocation {
  return {
    id: `city:${city.slug}`,
    slug: city.slug,
    type: "city",
    nameRu: city.nameRu,
    provinceRu: city.provinceRu,
    macroRegionRu: city.macroRegionRu,
    countryCode: "AR",
    countryRu: ARGENTINA_COUNTRY_RU,
    lat: city.lat,
    lng: city.lng,
    aliases: city.aliases,
  };
}

const GEO_LOCATIONS: GeoLocation[] = ARGENTINA_CITIES.map(cityToGeoLocation);

const locationBySlug = new Map(GEO_LOCATIONS.map((loc) => [loc.slug, loc]));
const locationLookup = new Map<string, GeoLocation>();

for (const loc of GEO_LOCATIONS) {
  locationLookup.set(normalizeKey(loc.nameRu), loc);
  locationLookup.set(normalizeKey(loc.slug), loc);
  for (const alias of loc.aliases) {
    locationLookup.set(normalizeKey(alias), loc);
  }
}

for (const [alias, macroRegionRu] of Object.entries(ARGENTINA_MACRO_REGION_ALIASES)) {
  const slug = normalizeKey(macroRegionRu).replace(/\s+/g, "-");
  if (!locationBySlug.has(slug)) {
    const macroLoc: GeoLocation = {
      id: `macro:${slug}`,
      slug,
      type: "macro_region",
      nameRu: macroRegionRu,
      countryCode: "AR",
      countryRu: ARGENTINA_COUNTRY_RU,
      aliases: [alias],
    };
    GEO_LOCATIONS.push(macroLoc);
    locationBySlug.set(slug, macroLoc);
    locationLookup.set(normalizeKey(alias), macroLoc);
    locationLookup.set(normalizeKey(macroRegionRu), macroLoc);
  }
}

export function getLocationBySlug(slug: string): GeoLocation | undefined {
  return locationBySlug.get(slug);
}

export function resolveLocation(input?: string | null): GeoLocation | undefined {
  if (!input?.trim()) return undefined;
  const normalized = normalizeKey(input.replace(/,\s*[^,]+$/u, ""));
  return locationLookup.get(normalized);
}

export function resolveMacroRegion(input?: string | null): string | undefined {
  if (!input?.trim()) return undefined;
  const normalized = normalizeKey(input);
  const fromAlias = ARGENTINA_MACRO_REGION_ALIASES[normalized];
  if (fromAlias) return fromAlias;
  const loc = resolveLocation(input);
  if (loc?.type === "macro_region") return loc.nameRu;
  if (loc?.macroRegionRu) return loc.macroRegionRu;
  return undefined;
}

export function listGeoLocations(type?: GeoLocationType): GeoLocation[] {
  if (!type) return GEO_LOCATIONS;
  return GEO_LOCATIONS.filter((loc) => loc.type === type);
}

export { GEO_LOCATIONS, normalizeKey as normalizeLocationKey };
