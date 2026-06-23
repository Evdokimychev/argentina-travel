import { addDays, addWeeks, format, startOfDay } from "date-fns";
import type { FlightPopularRoute } from "@/data/flight-popular-routes";
import {
  findPopularRouteLabel,
  getDestinationFlightRouteIds,
} from "@/lib/flights/destination-airports";
import {
  buildFlightsSearchQueryParams,
  type FlightsSearchHrefOptions,
} from "@/lib/flights/wl-search-params";

const INTERNATIONAL_DEPART_WEEKS = 6;
const DOMESTIC_DEPART_WEEKS = 3;
const POPULAR_ROUTE_RETURN_DAYS = 7;

export type { FlightsSearchHrefOptions };

export function buildFlightsSearchHref(
  origin: string,
  destination: string,
  options?: FlightsSearchHrefOptions,
): string {
  const params = buildFlightsSearchQueryParams(origin, destination, options);
  return `/flights?${params}`;
}

function popularRouteDepartWeeks(route: FlightPopularRoute): number {
  return route.origin === "BUE" ? DOMESTIC_DEPART_WEEKS : INTERNATIONAL_DEPART_WEEKS;
}

/** Prefill WL search for a popular route with sensible lead times and auto-search. */
export function buildFlightPopularRouteSearchHref(route: FlightPopularRoute): string {
  const depart = addWeeks(startOfDay(new Date()), popularRouteDepartWeeks(route));
  const returnDate = addDays(depart, POPULAR_ROUTE_RETURN_DAYS);

  return buildFlightsSearchHref(route.origin, route.destination, {
    departDate: format(depart, "yyyy-MM-dd"),
    returnDate: format(returnDate, "yyyy-MM-dd"),
    autoSearch: true,
  });
}

/** Map Argentina airport IATA to Aviasales city/route codes for search prefill. */
export function resolveAirportFlightSearch(airportCode: string): { origin: string; destination: string } {
  const code = airportCode.toUpperCase();
  if (code === "EZE" || code === "AEP") {
    return { origin: "MOW", destination: "BUE" };
  }
  return { origin: "BUE", destination: code };
}

export function buildAirportFlightsHref(airportCode: string): string {
  const { origin, destination } = resolveAirportFlightSearch(airportCode);
  return buildFlightsSearchHref(origin, destination);
}

/** Primary flight search prefill for a destination hub page (e.g. MOW→BUE for Игуасу). */
export function resolveDestinationFlightSearch(destinationId: string): {
  origin: string;
  destination: string;
} {
  const routeIds = getDestinationFlightRouteIds(destinationId);
  const routeId = routeIds.find((id) => id.startsWith("mow-")) ?? routeIds[0] ?? "mow-bue";
  const route = findPopularRouteLabel(routeId);
  if (route) {
    return { origin: route.origin, destination: route.destination };
  }

  const [origin, destination] = routeId.split("-");
  return { origin: origin.toUpperCase(), destination: destination.toUpperCase() };
}

export function buildDestinationFlightsHref(destinationId: string): string {
  const { origin, destination } = resolveDestinationFlightSearch(destinationId);
  return buildFlightsSearchHref(origin, destination);
}
