import type { FlightTripType } from "@/lib/travelpayouts/aviasales/types";

/** Travelpayouts WL: 0 = economy, 1 = business. */
export type FlightTripClass = 0 | 1;

/** Parsed flight search intent from `/flights` query string (our + Travelpayouts WL names). */
export type ParsedFlightsSearch = {
  origin: string;
  destination: string;
  departDate?: string;
  returnDate?: string;
  adults: number;
  children: number;
  infants: number;
  tripClass: FlightTripClass;
  tripType: FlightTripType;
  autoSearch: boolean;
};

export type FlightsSearchHrefOptions = {
  departDate?: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  infants?: number;
  /** Travelpayouts WL: 0 = economy, 1 = business. */
  tripClass?: FlightTripClass;
  oneWay?: boolean;
  /** When true, adds `search=1` so the WL widget auto-starts after load. */
  autoSearch?: boolean;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function readIsoDate(value: string | null): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || !ISO_DATE.test(trimmed)) return undefined;
  return trimmed;
}

function readIata(value: string | null): string | undefined {
  const trimmed = value?.trim().toUpperCase();
  if (!trimmed || trimmed.length < 2 || trimmed.length > 4) return undefined;
  return trimmed;
}

function readCount(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function readTripType(searchParams: URLSearchParams): FlightTripType {
  const oneWay = searchParams.get("one_way") ?? searchParams.get("oneWay");
  if (oneWay === "true" || oneWay === "1") return "one_way";
  if (oneWay === "false" || oneWay === "0") return "round_trip";
  const tripType = searchParams.get("tripType");
  if (tripType === "one_way" || tripType === "round_trip") return tripType;
  const returnDate = readIsoDate(searchParams.get("return_date") ?? searchParams.get("returnDate"));
  return returnDate ? "round_trip" : "one_way";
}

function readAutoSearch(searchParams: URLSearchParams): boolean {
  const flag = searchParams.get("search") ?? searchParams.get("autoSearch");
  return flag === "1" || flag === "true";
}

function readTripClass(searchParams: URLSearchParams): FlightTripClass {
  const value = searchParams.get("trip_class");
  if (value === "1") return 1;
  return 0;
}

/** Read flight search params from URL (supports legacy `origin`/`departDate` and WL `origin_iata`/`depart_date`). */
export function parseFlightsSearchParams(searchParams: URLSearchParams): ParsedFlightsSearch | null {
  const origin =
    readIata(searchParams.get("origin_iata")) ?? readIata(searchParams.get("origin"));
  const destination =
    readIata(searchParams.get("destination_iata")) ?? readIata(searchParams.get("destination"));
  if (!origin || !destination) return null;

  const tripType = readTripType(searchParams);
  const returnDate =
    tripType === "round_trip"
      ? readIsoDate(searchParams.get("return_date") ?? searchParams.get("returnDate"))
      : undefined;

  const adults = readCount(searchParams.get("adults"), 1, 1, 9);
  const children = readCount(searchParams.get("children"), 0, 0, 9);
  const infants = Math.min(
    adults,
    readCount(searchParams.get("infants"), 0, 0, 9),
  );

  return {
    origin,
    destination,
    departDate: readIsoDate(searchParams.get("depart_date") ?? searchParams.get("departDate")),
    returnDate,
    adults,
    children,
    infants,
    tripClass: readTripClass(searchParams),
    tripType,
    autoSearch: readAutoSearch(searchParams),
  };
}

export function hasMinimumFlightsSearchParams(params: ParsedFlightsSearch): boolean {
  return Boolean(params.origin && params.destination && params.departDate);
}

/** Build query string for `/flights` with Travelpayouts WL-compatible param names. */
export function buildFlightsSearchQueryParams(
  origin: string,
  destination: string,
  options?: FlightsSearchHrefOptions,
): URLSearchParams {
  const normalizedOrigin = origin.trim().toUpperCase();
  const normalizedDestination = destination.trim().toUpperCase();
  const oneWay = options?.oneWay ?? !options?.returnDate;
  const adults = Math.min(9, Math.max(1, options?.adults ?? 1));
  const children = Math.min(9, Math.max(0, options?.children ?? 0));
  const infants = Math.min(adults, Math.min(9, Math.max(0, options?.infants ?? 0)));
  const tripClass: FlightTripClass = options?.tripClass === 1 ? 1 : 0;

  const params = new URLSearchParams({
    origin: normalizedOrigin,
    destination: normalizedDestination,
    origin_iata: normalizedOrigin,
    destination_iata: normalizedDestination,
    adults: String(adults),
    children: String(children),
    infants: String(infants),
    trip_class: String(tripClass),
    one_way: oneWay ? "true" : "false",
  });

  if (options?.departDate) {
    params.set("departDate", options.departDate);
    params.set("depart_date", options.departDate);
  }

  if (!oneWay && options?.returnDate) {
    params.set("returnDate", options.returnDate);
    params.set("return_date", options.returnDate);
  }

  if (options?.autoSearch) {
    params.set("search", "1");
  }

  return params;
}

/** Sync browser URL to WL param names before the partner script reads `location.search`. */
export function ensureWlSearchParamsInUrl(params: ParsedFlightsSearch): void {
  if (typeof window === "undefined") return;

  const next = buildFlightsSearchQueryParams(params.origin, params.destination, {
    departDate: params.departDate,
    returnDate: params.returnDate,
    adults: params.adults,
    children: params.children,
    infants: params.infants,
    tripClass: params.tripClass,
    oneWay: params.tripType === "one_way",
    autoSearch: params.autoSearch,
  });

  const current = new URLSearchParams(window.location.search);
  let changed = false;
  for (const [key, value] of next.entries()) {
    if (current.get(key) !== value) {
      changed = true;
      break;
    }
  }
  if (!changed) return;

  const url = `${window.location.pathname}?${next}${window.location.hash}`;
  window.history.replaceState(window.history.state, "", url);
}
