import type { FlightTripType } from "@/lib/travelpayouts/aviasales/types";

/** Travelpayouts WL: 0 = economy, 1 = business. */
export type FlightTripClass = 0 | 1;

/** One leg of a Travelpayouts complex / multi-city WL search. */
export type FlightSearchSegment = {
  origin: string;
  destination: string;
  departDate: string;
};

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
  /** 2+ legs for Travelpayouts complex route (`segments[n][origin_iata]` URL params). */
  segments?: FlightSearchSegment[];
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
  /** Complex / open-jaw route — encoded as `segments[n][…]` URL params. */
  segments?: FlightSearchSegment[];
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_WL_SEGMENTS = 6;

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

function readSegmentsFromUrl(searchParams: URLSearchParams): FlightSearchSegment[] | undefined {
  const segments: FlightSearchSegment[] = [];

  for (let index = 0; index < MAX_WL_SEGMENTS; index += 1) {
    const origin =
      readIata(searchParams.get(`segments[${index}][origin_iata]`)) ??
      readIata(searchParams.get(`segments[${index}][origin]`));
    const destination =
      readIata(searchParams.get(`segments[${index}][destination_iata]`)) ??
      readIata(searchParams.get(`segments[${index}][destination]`));
    const departDate =
      readIsoDate(searchParams.get(`segments[${index}][depart_date]`)) ??
      readIsoDate(searchParams.get(`segments[${index}][date]`));

    if (!origin && !destination && !departDate) break;
    if (!origin || !destination || !departDate) continue;

    segments.push({ origin, destination, departDate });
  }

  return segments.length >= 2 ? segments : undefined;
}

function appendSegmentParams(params: URLSearchParams, segments: FlightSearchSegment[]): void {
  segments.forEach((segment, index) => {
    params.set(`segments[${index}][origin_iata]`, segment.origin);
    params.set(`segments[${index}][destination_iata]`, segment.destination);
    params.set(`segments[${index}][depart_date]`, segment.departDate);
    params.set(`segments[${index}][origin]`, segment.origin);
    params.set(`segments[${index}][destination]`, segment.destination);
    params.set(`segments[${index}][date]`, segment.departDate);
  });
}

/** Read flight search params from URL (supports legacy `origin`/`departDate` and WL `origin_iata`/`depart_date`). */
export function parseFlightsSearchParams(searchParams: URLSearchParams): ParsedFlightsSearch | null {
  const segments = readSegmentsFromUrl(searchParams);

  const origin =
    readIata(searchParams.get("origin_iata")) ??
    readIata(searchParams.get("origin")) ??
    segments?.[0]?.origin;
  const destination =
    readIata(searchParams.get("destination_iata")) ??
    readIata(searchParams.get("destination")) ??
    segments?.[0]?.destination;
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
    departDate:
      readIsoDate(searchParams.get("depart_date") ?? searchParams.get("departDate")) ??
      segments?.[0]?.departDate,
    returnDate,
    adults,
    children,
    infants,
    tripClass: readTripClass(searchParams),
    tripType,
    autoSearch: readAutoSearch(searchParams),
    segments,
  };
}

export function hasMinimumFlightsSearchParams(params: ParsedFlightsSearch): boolean {
  if (params.segments && params.segments.length >= 2) {
    return params.segments.every(
      (segment) => Boolean(segment.origin && segment.destination && segment.departDate),
    );
  }

  return Boolean(params.origin && params.destination && params.departDate);
}

export function buildParsedFlightsSearchFromSubmit(input: {
  origin: string;
  destination: string;
  departDate?: string;
  returnDate?: string;
  adults: number;
  children: number;
  infants: number;
  tripClass: FlightTripClass;
  oneWay: boolean;
}): ParsedFlightsSearch {
  const tripType: FlightTripType = input.oneWay || !input.returnDate ? "one_way" : "round_trip";

  return {
    origin: input.origin.trim().toUpperCase(),
    destination: input.destination.trim().toUpperCase(),
    departDate: input.departDate,
    returnDate: tripType === "round_trip" ? input.returnDate : undefined,
    adults: input.adults,
    children: input.children,
    infants: input.infants,
    tripClass: input.tripClass,
    tripType,
    autoSearch: Boolean(input.departDate),
  };
}

/** Merge 2+ one-way tour legs into a single Travelpayouts complex WL search. */
export function mergeTourFlightSearchesIntoComplex(
  searches: ParsedFlightsSearch[],
): ParsedFlightsSearch | null {
  if (searches.length < 2) return null;

  const segments: FlightSearchSegment[] = [];

  for (const search of searches) {
    if (search.tripType === "round_trip" || !search.departDate) return null;
    segments.push({
      origin: search.origin,
      destination: search.destination,
      departDate: search.departDate,
    });
  }

  if (segments.length < 2) return null;

  const first = searches[0]!;

  return {
    origin: segments[0]!.origin,
    destination: segments[0]!.destination,
    departDate: segments[0]!.departDate,
    adults: first.adults,
    children: first.children,
    infants: first.infants,
    tripClass: first.tripClass,
    tripType: "one_way",
    segments,
    autoSearch: true,
  };
}

/** Build query string for `/flights` with Travelpayouts WL-compatible param names. */
export function buildFlightsSearchQueryParams(
  origin: string,
  destination: string,
  options?: FlightsSearchHrefOptions,
): URLSearchParams {
  const normalizedOrigin = origin.trim().toUpperCase();
  const normalizedDestination = destination.trim().toUpperCase();
  const segments =
    options?.segments && options.segments.length >= 2
      ? options.segments.map((segment) => ({
          origin: segment.origin.trim().toUpperCase(),
          destination: segment.destination.trim().toUpperCase(),
          departDate: segment.departDate,
        }))
      : undefined;
  const isComplex = Boolean(segments);
  const oneWay = isComplex ? true : (options?.oneWay ?? !options?.returnDate);
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

  if (segments) {
    appendSegmentParams(params, segments);
    params.set("departDate", segments[0]!.departDate);
    params.set("depart_date", segments[0]!.departDate);
  } else if (options?.departDate) {
    params.set("departDate", options.departDate);
    params.set("depart_date", options.departDate);
  }

  if (!isComplex && !oneWay && options?.returnDate) {
    params.set("returnDate", options.returnDate);
    params.set("return_date", options.returnDate);
  }

  if (options?.autoSearch) {
    params.set("search", "1");
  }

  return params;
}

export type WlUrlSyncMode = "page" | "inline" | "none";

const WL_OWNED_QUERY_KEYS = new Set([
  "origin",
  "destination",
  "origin_iata",
  "destination_iata",
  "adults",
  "children",
  "infants",
  "trip_class",
  "one_way",
  "oneWay",
  "departDate",
  "depart_date",
  "returnDate",
  "return_date",
  "search",
  "autoSearch",
  "tripType",
]);

function isWlOwnedQueryKey(key: string): boolean {
  if (WL_OWNED_QUERY_KEYS.has(key)) return true;
  return /^segments\[\d+\]\[(?:origin_iata|destination_iata|depart_date|origin|destination|date)\]$/.test(
    key,
  );
}

/** Remove Travelpayouts WL keys from a query string (keeps unrelated params like `access`). */
export function stripWlSearchParamsFromQuery(searchParams: URLSearchParams): void {
  for (const key of [...searchParams.keys()]) {
    if (isWlOwnedQueryKey(key)) searchParams.delete(key);
  }
}

function buildWlSearchQueryParams(params: ParsedFlightsSearch): URLSearchParams {
  return buildFlightsSearchQueryParams(params.origin, params.destination, {
    departDate: params.departDate,
    returnDate: params.returnDate,
    adults: params.adults,
    children: params.children,
    infants: params.infants,
    tripClass: params.tripClass,
    oneWay: params.tripType === "one_way",
    autoSearch: params.autoSearch,
    segments: params.segments,
  });
}

function queryStringsEqual(a: URLSearchParams, b: URLSearchParams): boolean {
  if (a.toString() === b.toString()) return true;
  for (const [key, value] of b.entries()) {
    if (a.get(key) !== value) return false;
  }
  for (const key of a.keys()) {
    if (!b.has(key)) return false;
  }
  return true;
}

let savedInlineSearchBeforeStaging: string | null = null;

/** Restore URL search string saved before inline WL staging (e.g. modal close). */
export function restoreInlineWlSearchParams(): void {
  if (typeof window === "undefined" || savedInlineSearchBeforeStaging === null) return;

  const url = `${window.location.pathname}${savedInlineSearchBeforeStaging}${window.location.hash}`;
  window.history.replaceState(window.history.state, "", url);
  savedInlineSearchBeforeStaging = null;
}

/**
 * Sync browser URL to WL param names before the partner script reads `location.search`.
 * - `page`: replace query on `/flights` and `/embed/flights` only.
 * - `inline`: merge WL params on current pathname, preserving unrelated query keys.
 */
export function ensureWlSearchParamsInUrl(
  params: ParsedFlightsSearch,
  mode: WlUrlSyncMode = "page",
): void {
  if (typeof window === "undefined" || mode === "none") return;

  if (
    mode === "page" &&
    !window.location.pathname.startsWith("/flights") &&
    !window.location.pathname.startsWith("/embed/flights")
  ) {
    return;
  }

  const wlParams = buildWlSearchQueryParams(params);

  if (mode === "inline" && savedInlineSearchBeforeStaging === null) {
    savedInlineSearchBeforeStaging = window.location.search;
  }

  const next =
    mode === "inline"
      ? (() => {
          const merged = new URLSearchParams(window.location.search);
          stripWlSearchParamsFromQuery(merged);
          for (const [key, value] of wlParams.entries()) {
            merged.set(key, value);
          }
          return merged;
        })()
      : wlParams;

  const current = new URLSearchParams(window.location.search);
  if (queryStringsEqual(current, next)) return;

  const search = next.toString();
  const url = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;
  window.history.replaceState(window.history.state, "", url);
}

/**
 * Embed URL for tour flight modal iframe.
 * Uses `/embed/*` — SiteChrome renders no header/footer (see SiteChrome.tsx).
 * Never call ensureWlSearchParamsInUrl on tour pages: it changes searchParams and
 * triggers Next.js RSC refresh (tour page is force-dynamic).
 */
/** Stable key for remounting inline WL when search intent changes. */
export function buildWlWidgetRemountKey(params: ParsedFlightsSearch): string {
  if (params.segments?.length) {
    return params.segments
      .map((segment) => `${segment.origin}-${segment.destination}-${segment.departDate}`)
      .join("|");
  }

  return `${params.origin}-${params.destination}-${params.departDate ?? ""}-${params.returnDate ?? ""}-${params.tripType}`;
}

export function buildFlightsWlEmbedHref(params: ParsedFlightsSearch): string {
  const qs = buildFlightsSearchQueryParams(params.origin, params.destination, {
    departDate: params.departDate,
    returnDate: params.returnDate,
    adults: params.adults,
    children: params.children,
    infants: params.infants,
    tripClass: params.tripClass,
    oneWay: params.tripType === "one_way",
    autoSearch: params.autoSearch || hasMinimumFlightsSearchParams(params),
    segments: params.segments,
  });

  return `/embed/flights/wl?${qs.toString()}`;
}
