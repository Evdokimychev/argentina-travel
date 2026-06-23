import { FLIGHT_POPULAR_ROUTES } from "@/data/flight-popular-routes";
import { getAirport } from "@/data/argentina-domestic-routes";

/** Destination slug → flight routes relevant for travelers (international + domestic leg). */
const DESTINATION_ROUTE_IDS: Record<string, string[]> = {
  ba: ["mow-bue"],
  bariloche: ["mow-bue", "bue-brc"],
  calafate: ["mow-bue", "bue-fte"],
  ushuaia: ["mow-bue", "bue-ush"],
  iguazu: ["mow-bue", "bue-igr"],
  mendoza: ["mow-bue", "bue-mdz"],
  salta: ["mow-bue", "bue-sla"],
  patagonia: ["mow-bue", "bue-brc", "bue-fte"],
};

const TOUR_FLIGHT_RULES: Array<{ test: RegExp; routeIds: string[] }> = [
  { test: /ushuaia|ушуайя|огненн/i, routeIds: ["mow-bue", "bue-ush"] },
  { test: /calafate|калафат|perito|перито/i, routeIds: ["mow-bue", "bue-fte"] },
  { test: /bariloche|барилоч/i, routeIds: ["mow-bue", "bue-brc"] },
  { test: /iguaz|игуас/i, routeIds: ["mow-bue", "bue-igr"] },
  { test: /mendoza|мендос/i, routeIds: ["mow-bue", "bue-mdz"] },
  { test: /salta|сальт/i, routeIds: ["mow-bue", "bue-sla"] },
  { test: /patagonia|патагон/i, routeIds: ["mow-bue", "bue-brc", "bue-fte"] },
  { test: /buenos|buenos|buenos-aires|buenos|буэнос/i, routeIds: ["mow-bue"] },
];

/** Excursion city slug (Tripster canonical) → flight routes for sidebar teasers. */
const EXCURSION_CITY_ROUTE_IDS: Record<string, string[]> = {
  Buenos_Aires: ["mow-bue"],
  Ushuaia: ["mow-bue", "bue-ush"],
  Mendoza: ["mow-bue", "bue-mdz"],
  Puerto_Iguazu: ["mow-bue", "bue-igr"],
  Bariloche: ["mow-bue", "bue-brc"],
  El_Calafate: ["mow-bue", "bue-fte"],
  Salta: ["mow-bue", "bue-sla"],
};

export function getExcursionCityFlightRouteIds(citySlug: string): string[] {
  return EXCURSION_CITY_ROUTE_IDS[citySlug] ?? [];
}

export function getDestinationFlightRouteIds(destinationId: string): string[] {
  return DESTINATION_ROUTE_IDS[destinationId] ?? ["mow-bue"];
}

/** Resolve Aviasales route ids from tour destination/region text. */
export function resolveTourFlightRouteIds(destination: string, region: string): string[] {
  const haystack = `${destination} ${region}`.trim();
  if (!haystack) return ["mow-bue"];

  for (const rule of TOUR_FLIGHT_RULES) {
    if (rule.test.test(haystack)) return rule.routeIds;
  }

  return ["mow-bue"];
}

export function resolveDomesticRouteAviasalesOrigin(hub: "AEP" | "EZE"): string {
  return "BUE";
}

export function resolveDomesticRouteLabels(
  hub: "AEP" | "EZE",
  destinationCode: string
): { origin: string; destination: string; originLabel: string; destinationLabel: string } {
  const destAirport = getAirport(destinationCode);
  const hubAirport = getAirport(hub);
  return {
    origin: resolveDomesticRouteAviasalesOrigin(hub),
    destination: destinationCode,
    originLabel: hubAirport?.city ?? "Буэнос-Айрес",
    destinationLabel: destAirport?.city ?? destinationCode,
  };
}

export function findPopularRouteLabel(routeId: string): (typeof FLIGHT_POPULAR_ROUTES)[number] | undefined {
  return FLIGHT_POPULAR_ROUTES.find((route) => route.id === routeId);
}
