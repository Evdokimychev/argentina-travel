import airportsSeed from "@/data/geo/airports.json";
import type { GeoAirport, GeoCountryCode } from "./types";

const AIRPORTS: GeoAirport[] = airportsSeed as GeoAirport[];

const airportByIata = new Map<string, GeoAirport>(
  AIRPORTS.map((airport) => [airport.iata.toUpperCase(), airport]),
);

const COUNTRY_FLAGS: Record<GeoCountryCode, string> = {
  AR: "🇦🇷",
  BR: "🇧🇷",
  RU: "🇷🇺",
  TR: "🇹🇷",
  ES: "🇪🇸",
  IT: "🇮🇹",
  FR: "🇫🇷",
  GB: "🇬🇧",
  AE: "🇦🇪",
  US: "🇺🇸",
  CL: "🇨🇱",
  PE: "🇵🇪",
};

export function getCountryFlag(countryCode: GeoCountryCode): string {
  return COUNTRY_FLAGS[countryCode] ?? "";
}

export function getAirportByIata(iata: string): GeoAirport | undefined {
  const normalized = iata.trim().toUpperCase();
  if (normalized === "AEP" || normalized === "EZE") {
    return airportByIata.get(normalized);
  }
  return airportByIata.get(normalized);
}

export function getAirportDisplayName(iata: string): string {
  const normalized = iata.trim().toUpperCase();
  if (normalized === "BUE") {
    return airportByIata.get("BUE")?.cityRu ?? "Буэнос-Айрес";
  }
  if (normalized === "AEP" || normalized === "EZE") {
    return airportByIata.get("BUE")?.cityRu ?? "Буэнос-Айрес";
  }
  const airport = airportByIata.get(normalized);
  return airport?.cityRu ?? normalized;
}

export function getAirportFullLabel(iata: string): string {
  const normalized = iata.trim().toUpperCase();
  const airport = getAirportByIata(normalized === "AEP" || normalized === "EZE" ? normalized : normalized);
  if (!airport) return normalized;
  if (normalized === "BUE") {
    return `${airport.cityRu}, ${airport.countryRu}`;
  }
  return `${airport.nameRu} (${airport.iata})`;
}

export function listAirports(): GeoAirport[] {
  return AIRPORTS;
}

export function searchAirports(query: string, limit = 12): GeoAirport[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: GeoAirport[] = [];
  for (const airport of AIRPORTS) {
    const haystack = [
      airport.iata,
      airport.icao ?? "",
      airport.nameRu,
      airport.nameEn,
      airport.cityRu,
      airport.countryRu,
    ]
      .join(" ")
      .toLowerCase();
    if (haystack.includes(q)) {
      results.push(airport);
    }
    if (results.length >= limit) break;
  }

  return results.sort((a, b) => b.popularity - a.popularity);
}

export { AIRPORTS, airportByIata, COUNTRY_FLAGS };
