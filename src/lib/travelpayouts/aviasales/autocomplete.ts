import type { AviasalesPlace } from "@/lib/travelpayouts/aviasales/types";

const AUTocomplete_URL = "https://autocomplete.travelpayouts.com/places2";

type RawPlace = {
  code?: string;
  name?: string;
  type?: string;
  country_name?: string;
  country_code?: string;
  city_name?: string;
  city_code?: string;
};

function mapPlace(item: RawPlace): AviasalesPlace | null {
  const code = item.code?.trim().toUpperCase();
  const name = item.name?.trim();
  if (!code || !name) return null;

  const type =
    item.type === "airport" || item.type === "city" || item.type === "country"
      ? item.type
      : "city";

  return {
    code,
    name,
    type,
    countryName: item.country_name?.trim(),
    countryCode: item.country_code?.trim(),
    cityName: item.city_name?.trim(),
    cityCode: item.city_code?.trim(),
  };
}

export function formatPlaceLabel(place: AviasalesPlace): string {
  const parts = [place.name, place.countryName].filter(Boolean);
  return `${parts.join(", ")} (${place.code})`;
}

export async function searchAviasalesPlaces(
  term: string,
  locale: string
): Promise<AviasalesPlace[]> {
  const query = term.trim();
  if (query.length < 2) return [];

  const url = new URL(AUTocomplete_URL);
  url.searchParams.set("term", query);
  url.searchParams.set("locale", locale);
  url.searchParams.append("types[]", "city");
  url.searchParams.append("types[]", "airport");

  const response = await fetch(url, { next: { revalidate: 86400 } });
  if (!response.ok) return [];

  const payload = (await response.json().catch(() => null)) as RawPlace[] | null;
  if (!Array.isArray(payload)) return [];

  const seen = new Set<string>();
  const results: AviasalesPlace[] = [];

  for (const item of payload) {
    const place = mapPlace(item);
    if (!place || seen.has(place.code)) continue;
    seen.add(place.code);
    results.push(place);
    if (results.length >= 8) break;
  }

  return results;
}
