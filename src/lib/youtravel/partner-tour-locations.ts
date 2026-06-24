import type { YouTravelTour } from "@/lib/youtravel/types";

type YouTravelCityValue = string | { name?: string; nameRu?: string } | undefined | null;

export function resolveYouTravelCountry(payload: YouTravelTour): string | undefined {
  const country = payload.country;
  if (typeof country === "string") {
    const trimmed = country.trim();
    return trimmed || undefined;
  }
  if (country && typeof country === "object") {
    return country.nameRu?.trim() || country.name?.trim() || undefined;
  }
  if (Array.isArray(payload.countries) && payload.countries[0]) {
    const trimmed = String(payload.countries[0]).trim();
    return trimmed || undefined;
  }
  return payload.destination?.trim() || undefined;
}

/** Город + одна страна без повторов — как на YouTravel.me. */
export function normalizeYouTravelArrivalCityLabel(raw?: string | null): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;

  const parts = trimmed
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length) return undefined;

  const cityName = parts[0]!;
  const seen = new Set<string>();
  let country: string | undefined;

  for (const part of parts.slice(1)) {
    const key = part.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    if (!country) country = part;
  }

  return country ? `${cityName}, ${country}` : cityName;
}

function resolvePrimaryCountryLabel(country?: string): string | undefined {
  const trimmed = country?.trim();
  if (!trimmed) return undefined;
  return trimmed.split(",")[0]?.trim() || undefined;
}

export function resolveYouTravelCityLabel(
  value: YouTravelCityValue,
  country?: string,
): string | undefined {
  let city: string | undefined;

  if (typeof value === "string") {
    city = value.trim() || undefined;
  } else if (value && typeof value === "object") {
    city = value.nameRu?.trim() || value.name?.trim() || undefined;
  }

  if (!city) return undefined;

  if (city.includes(",")) {
    return normalizeYouTravelArrivalCityLabel(city);
  }

  const primaryCountry = resolvePrimaryCountryLabel(country);
  if (primaryCountry && !city.toLowerCase().includes(primaryCountry.toLowerCase())) {
    return `${city}, ${primaryCountry}`;
  }

  return city;
}

/** Parse scraped arrival strings like "22 февраля, 16:00 (местное время)". */
export function parseYouTravelArrivalDateTime(raw?: string): {
  datePart?: string;
  timePart?: string;
} {
  const trimmed = raw?.trim();
  if (!trimmed) return {};

  const timeMatch = trimmed.match(/(\d{1,2}:\d{2})/);
  const timePart = timeMatch?.[1];

  let datePart = trimmed
    .replace(/\s*\(\s*местное\s+время\s*\)/gi, "")
    .replace(/,\s*\d{1,2}:\d{2}.*$/, "")
    .trim();

  if (!datePart) datePart = trimmed;

  return {
    datePart: datePart || undefined,
    timePart: timePart || undefined,
  };
}

function parseIsoDate(isoDate: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return new Date(`${isoDate}T12:00:00`);
  }
  return new Date(isoDate);
}

export function formatYouTravelArrivalDisplayDate(
  isoDate: string,
  timePart?: string,
): string | undefined {
  const parsed = parseIsoDate(isoDate);
  if (Number.isNaN(parsed.getTime())) return undefined;

  const dateLabel = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
  }).format(parsed);

  const time = timePart?.trim();
  if (time) {
    return `${dateLabel}, ${time} (местное время)`;
  }

  return dateLabel;
}

export function resolveYouTravelStartCity(payload: YouTravelTour): string | undefined {
  const country = resolveYouTravelCountry(payload);
  return (
    resolveYouTravelCityLabel(payload.start_point_city, country) ??
    resolveYouTravelCityLabel(payload.city, country) ??
    (payload.destination?.trim() || undefined)
  );
}

export function resolveYouTravelFinishCity(payload: YouTravelTour): string | undefined {
  const country = resolveYouTravelCountry(payload);
  return resolveYouTravelCityLabel(payload.finish_point_city, country);
}
