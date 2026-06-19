import type { FlightSearchParams } from "@/lib/travelpayouts/aviasales/types";

function formatSearchDateSegment(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  if (!month || !day) return "";
  return `${day}${month}`;
}

/** Aviasales search path segment, e.g. MOW1509BUE2209 */
export function buildAviasalesSearchPath(params: Pick<FlightSearchParams, "origin" | "destination" | "departDate" | "returnDate">): string {
  const origin = params.origin.trim().toUpperCase();
  const destination = params.destination.trim().toUpperCase();
  const depart = formatSearchDateSegment(params.departDate);
  let path = `${origin}${depart}${destination}`;
  if (params.returnDate) {
    path += formatSearchDateSegment(params.returnDate);
  }
  return path;
}

export function buildAviasalesSearchUrl(
  host: string,
  params: FlightSearchParams
): string {
  const path = buildAviasalesSearchPath(params);
  const url = new URL(`${host.replace(/\/$/, "")}/search/${path}`);
  url.searchParams.set("adults", String(params.adults));
  if (params.children > 0) url.searchParams.set("children", String(params.children));
  if (params.infants > 0) url.searchParams.set("infants", String(params.infants));
  return url.toString();
}

export function buildAviasalesTicketUrl(host: string, ticketPath: string): string {
  const trimmed = ticketPath.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const normalizedHost = host.replace(/\/$/, "");
  return trimmed.startsWith("/") ? `${normalizedHost}${trimmed}` : `${normalizedHost}/${trimmed}`;
}
