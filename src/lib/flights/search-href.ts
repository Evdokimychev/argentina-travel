import {
  findPopularRouteLabel,
  getDestinationFlightRouteIds,
} from "@/lib/flights/destination-airports";

export function buildFlightsSearchHref(origin: string, destination: string): string {
  return `/flights?${new URLSearchParams({
    origin: origin.toUpperCase(),
    destination: destination.toUpperCase(),
  })}`;
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

/** Primary flight search prefill for a destination hub page (e.g. MOW→IGR for Игуасу). */
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
