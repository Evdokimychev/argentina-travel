import "server-only";

import { unstable_cache } from "next/cache";
import { FLIGHT_POPULAR_ROUTES } from "@/data/flight-popular-routes";
import { getDestinationFlightRouteIds } from "@/lib/flights/destination-airports";
import {
  fetchLatestFlightPrices,
  resolveAviasalesMarket,
} from "@/lib/travelpayouts/aviasales";
import { isTravelpayoutsConfigured } from "@/lib/travelpayouts";
import type { LocaleCode } from "@/types/locale";

export type FlightPriceTeaser = {
  routeId: string;
  origin: string;
  destination: string;
  originLabel: string;
  destinationLabel: string;
  price: number;
  currency: string;
  departureAt: string;
  ticketPath?: string;
};

/** Routes shown as live price hints in content hubs (not the full catalog). */
export const HUB_FLIGHT_TEASER_ROUTE_IDS = ["mow-bue", "bue-brc", "bue-fte"] as const;

export const HOME_TRAVEL_PREP_ROUTE_IDS = ["mow-bue"] as const;

async function fetchFlightPriceTeasersForRoutesUncached(
  routeIds: readonly string[],
  locale: LocaleCode = "ru"
): Promise<FlightPriceTeaser[]> {
  if (!isTravelpayoutsConfigured()) return [];

  const market = resolveAviasalesMarket(locale);
  const teasers: FlightPriceTeaser[] = [];

  for (const routeId of routeIds) {
    const route = FLIGHT_POPULAR_ROUTES.find((entry) => entry.id === routeId);
    if (!route) continue;

    const offers = await fetchLatestFlightPrices({
      origin: route.origin,
      destination: route.destination,
      currency: market.currency,
      limit: 1,
    });

    const best = offers[0];
    if (!best) continue;

    teasers.push({
      routeId: route.id,
      origin: route.origin,
      destination: route.destination,
      originLabel: route.originLabel,
      destinationLabel: route.destinationLabel,
      price: best.price,
      currency: best.currency,
      departureAt: best.departureAt,
      ticketPath: best.ticketPath,
    });
  }

  return teasers;
}

export function getFlightPriceTeasers(routeIds: readonly string[], locale: LocaleCode = "ru") {
  const cacheKey = routeIds.join(",");
  return unstable_cache(
    () => fetchFlightPriceTeasersForRoutesUncached(routeIds, locale),
    ["flight-price-teasers", locale, cacheKey],
    { revalidate: 3600 }
  )();
}

export function getHubFlightPriceTeasers(locale: LocaleCode = "ru") {
  return getFlightPriceTeasers(HUB_FLIGHT_TEASER_ROUTE_IDS, locale);
}

export function getDestinationFlightTeasers(destinationId: string, locale: LocaleCode = "ru") {
  const routeIds = getDestinationFlightRouteIds(destinationId);
  return getFlightPriceTeasers(routeIds, locale);
}

export function getHomeTravelPrepFlightTeaser(locale: LocaleCode = "ru") {
  return getFlightPriceTeasers(HOME_TRAVEL_PREP_ROUTE_IDS, locale);
}

export async function fetchRouteFlightPriceTeaser(input: {
  origin: string;
  destination: string;
  originLabel: string;
  destinationLabel: string;
  routeId: string;
  locale?: LocaleCode;
}): Promise<FlightPriceTeaser | null> {
  if (!isTravelpayoutsConfigured()) return null;

  const locale = input.locale ?? "ru";
  const market = resolveAviasalesMarket(locale);
  const offers = await fetchLatestFlightPrices({
    origin: input.origin,
    destination: input.destination,
    currency: market.currency,
    limit: 1,
  });

  const best = offers[0];
  if (!best) return null;

  return {
    routeId: input.routeId,
    origin: input.origin,
    destination: input.destination,
    originLabel: input.originLabel,
    destinationLabel: input.destinationLabel,
    price: best.price,
    currency: best.currency,
    departureAt: best.departureAt,
    ticketPath: best.ticketPath,
  };
}
