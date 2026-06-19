import { NextResponse } from "next/server";
import {
  formatTransferLocationLabel,
  searchTransferLocations,
  TRANSFER_LOCATIONS,
} from "@/data/transfer-locations";
import { searchIntuiLocations } from "@/lib/intui/search";
import { searchAviasalesPlaces } from "@/lib/travelpayouts/aviasales/autocomplete";
import type { TransferLocation } from "@/lib/intui/types";
import type { LocaleCode } from "@/types/locale";

const LOCALES = new Set<LocaleCode>(["ru", "en", "es", "pt"]);

function mapAirportPlace(place: {
  code: string;
  name: string;
  countryName?: string;
  type: string;
}): TransferLocation {
  return {
    id: `airport-${place.code}`,
    name: place.name,
    type: "airport",
    code: place.code,
    countryName: place.countryName,
  };
}

function dedupeLocations(locations: TransferLocation[]): TransferLocation[] {
  const seen = new Set<string>();
  const results: TransferLocation[] = [];

  for (const location of locations) {
    const key = `${location.type}:${location.code ?? ""}:${location.lat ?? ""}:${location.lng ?? ""}:${location.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(location);
    if (results.length >= 8) break;
  }

  return results;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get("term")?.trim() ?? "";
  const localeParam = searchParams.get("locale")?.trim() ?? "ru";
  const locale = LOCALES.has(localeParam as LocaleCode) ? (localeParam as LocaleCode) : "ru";

  if (term.length < 2) {
    return NextResponse.json({ locations: TRANSFER_LOCATIONS.slice(0, 6) });
  }

  const [intuiResults, aviasalesResults] = await Promise.all([
    searchIntuiLocations(term, locale),
    searchAviasalesPlaces(term, locale),
  ]);

  const localResults = searchTransferLocations(term);
  const airportResults = aviasalesResults
    .filter((place) => place.type === "airport")
    .map(mapAirportPlace);

  const locations = dedupeLocations([...localResults, ...intuiResults, ...airportResults]);

  return NextResponse.json({
    locations,
    formatLabel: locations.map((location) => formatTransferLocationLabel(location)),
  });
}
