import { SEARCH_DESTINATIONS } from "@/data/filters";
import type { TourListing } from "@/types";

export type SearchDestination = (typeof SEARCH_DESTINATIONS)[number];

export type SearchDestinationResult = SearchDestination & {
  tourCount: number;
  displayTitle: string;
  subtitle: string;
  matchScore: number;
};

const TYPE_LABEL: Record<SearchDestination["type"], string> = {
  city: "Город",
  region: "Регион",
  country: "Страна",
  landmark: "Место",
  park: "Национальный парк",
};

function destinationKeywords(destination: SearchDestination): string[] {
  const base = destination.keywords ? [...destination.keywords] : [];
  return [destination.label, destination.region, ...base];
}

function buildHaystack(tour: TourListing): string {
  return [tour.destination, tour.region, tour.title, tour.shortDescription]
    .join(" ")
    .toLowerCase();
}

export function getSearchDestinationDisplayTitle(destination: SearchDestination): string {
  if (destination.type === "landmark" || destination.type === "park") {
    const nearCity = "nearCity" in destination ? destination.nearCity : undefined;
    if (nearCity) {
      return `${destination.label}, ${nearCity}`;
    }
  }
  return destination.label;
}

export function getSearchDestinationSubtitle(destination: SearchDestination): string {
  const kind = TYPE_LABEL[destination.type];
  const nearCity = "nearCity" in destination ? destination.nearCity : undefined;

  if (destination.type === "city") {
    return `${kind} · ${destination.description}`;
  }

  if (destination.type === "country" || destination.type === "region") {
    return `${kind} · ${destination.description}`;
  }

  if (nearCity) {
    return `${kind} · ${destination.description} · рядом с ${nearCity}`;
  }

  return `${kind} · ${destination.description} · ${destination.region}`;
}

export function tourMatchesSearchDestination(
  tour: TourListing,
  destination: SearchDestination
): boolean {
  if (destination.type === "country") {
    return true;
  }

  const haystack = buildHaystack(tour);
  const label = destination.label.toLowerCase();
  const region = destination.region.toLowerCase();

  if (haystack.includes(label)) return true;

  if (destination.type === "region") {
    return haystack.includes(region) || haystack.includes(label);
  }

  const nearCity =
    "nearCity" in destination && destination.nearCity
      ? destination.nearCity.toLowerCase()
      : null;
  if (nearCity && haystack.includes(nearCity)) return true;

  return destinationKeywords(destination).some((term) =>
    haystack.includes(term.toLowerCase())
  );
}

export function countToursForSearchDestination(
  tours: TourListing[],
  destination: SearchDestination
): number {
  return tours.filter((tour) => tourMatchesSearchDestination(tour, destination)).length;
}

function scoreDestinationMatch(destination: SearchDestination, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  const label = destination.label.toLowerCase();
  const region = destination.region.toLowerCase();
  const description = destination.description.toLowerCase();
  const nearCity =
    "nearCity" in destination && destination.nearCity
      ? destination.nearCity.toLowerCase()
      : "";

  if (label === q) return 100;
  if (label.startsWith(q)) return 90;
  if (label.includes(q)) return 75;

  if (nearCity && (nearCity.startsWith(q) || nearCity.includes(q))) return 70;
  if (region.startsWith(q) || region.includes(q)) return 55;
  if (description.includes(q)) return 45;

  let keywordBest = 0;
  for (const term of destinationKeywords(destination)) {
    const lower = term.toLowerCase();
    if (lower === q) keywordBest = Math.max(keywordBest, 85);
    else if (lower.startsWith(q)) keywordBest = Math.max(keywordBest, 65);
    else if (lower.includes(q) || q.includes(lower)) keywordBest = Math.max(keywordBest, 50);
  }

  return keywordBest;
}

function enrichDestination(
  destination: SearchDestination,
  tours: TourListing[],
  matchScore: number
): SearchDestinationResult {
  return {
    ...destination,
    tourCount: countToursForSearchDestination(tours, destination),
    displayTitle: getSearchDestinationDisplayTitle(destination),
    subtitle: getSearchDestinationSubtitle(destination),
    matchScore,
  };
}

export function getSearchDestinationResults(
  tours: TourListing[],
  options?: { query?: string; popularOnly?: boolean; limit?: number }
): SearchDestinationResult[] {
  const query = options?.query?.trim() ?? "";
  const limit = options?.limit ?? 12;

  let list = SEARCH_DESTINATIONS.map((destination) =>
    enrichDestination(destination, tours, scoreDestinationMatch(destination, query))
  );

  if (query) {
    list = list
      .filter((item) => item.matchScore > 0)
      .sort(
        (a, b) =>
          b.matchScore - a.matchScore ||
          b.tourCount - a.tourCount ||
          a.label.localeCompare(b.label, "ru")
      );
  } else if (options?.popularOnly) {
    list = list
      .filter((item) => item.type === "city")
      .sort(
        (a, b) =>
          b.tourCount - a.tourCount || a.label.localeCompare(b.label, "ru")
      );
  } else {
    list = list.sort(
      (a, b) =>
        b.tourCount - a.tourCount || a.label.localeCompare(b.label, "ru")
    );
  }

  return list.slice(0, limit);
}

/** @deprecated Используйте getSearchDestinationResults */
export function getSearchDestinationsWithCounts(
  tours: TourListing[],
  options?: { query?: string; popularOnly?: boolean }
) {
  return getSearchDestinationResults(tours, options);
}
