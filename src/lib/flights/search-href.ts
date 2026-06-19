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
