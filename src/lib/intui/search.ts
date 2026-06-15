import "server-only";

import { IntuiError, postIntuiMethod } from "@/lib/intui/client";
import { getIntuiConfig, isIntuiConfigured } from "@/lib/intui/env";
import { mapIntuiTransferOffers, extractIntuiOfferArray } from "@/lib/intui/mapper";
import type {
  TransferLocation,
  TransferOffer,
  TransferSearchParams,
  TransferSearchResult,
} from "@/lib/intui/types";

type SearchMethodSpec = {
  endpoint: string;
  params: Record<string, unknown>;
};

function readString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function resolveRouteMethod(origin: TransferLocation, destination: TransferLocation): "IG" | "GI" | "II" | "GG" {
  if (origin.type === "airport" && origin.code && destination.lat != null && destination.lng != null) {
    return "IG";
  }
  if (origin.lat != null && origin.lng != null && destination.type === "airport" && destination.code) {
    return "GI";
  }
  if (origin.type === "airport" && origin.code && destination.type === "airport" && destination.code) {
    return "II";
  }
  return "GG";
}

function buildPassengerParams(params: TransferSearchParams): Record<string, unknown> {
  return {
    lang: params.lang,
    currency: params.currency,
    adults: params.adults,
    children: params.children,
    infants: params.infants,
    date: params.date,
    time: params.time,
    coordinatesType: "WGS84",
  };
}

function buildGetAvailCarSpec(params: TransferSearchParams): SearchMethodSpec {
  const method = resolveRouteMethod(params.origin, params.destination);
  const body: Record<string, unknown> = {
    method,
    ...buildPassengerParams(params),
  };

  if (method === "IG" && params.origin.code) {
    body.iata = params.origin.code;
    body.lat = params.destination.lat;
    body.lng = params.destination.lng;
  } else if (method === "GI" && params.destination.code) {
    body.iata = params.destination.code;
    body.lat = params.origin.lat;
    body.lng = params.origin.lng;
  } else if (method === "II") {
    body.iata = params.origin.code;
    body.iataTo = params.destination.code;
  } else {
    body.latFrom = params.origin.lat;
    body.lngFrom = params.origin.lng;
    body.latTo = params.destination.lat;
    body.lngTo = params.destination.lng;
  }

  return { endpoint: "GetAvailCar", params: body };
}

/** API Wide: airport → geo-point (Intui docs) */
function buildDestinationAirportToMPointSpec(params: TransferSearchParams): SearchMethodSpec | null {
  if (params.origin.type !== "airport" || !params.origin.code) return null;
  if (params.destination.lat == null || params.destination.lng == null) return null;

  return {
    endpoint: "DestinationAirportToMPoint",
    params: {
      iata: params.origin.code,
      lat: params.destination.lat,
      lng: params.destination.lng,
      ...buildPassengerParams(params),
    },
  };
}

/** API Wide: geo-point → airport (Intui docs) */
function buildDestinationPointToMAirportSpec(params: TransferSearchParams): SearchMethodSpec | null {
  if (params.destination.type !== "airport" || !params.destination.code) return null;
  if (params.origin.lat == null || params.origin.lng == null) return null;

  return {
    endpoint: "DestinationPointToMAirport",
    params: {
      iata: params.destination.code,
      lat: params.origin.lat,
      lng: params.origin.lng,
      ...buildPassengerParams(params),
    },
  };
}

function buildSearchSpecs(params: TransferSearchParams): SearchMethodSpec[] {
  const specs: SearchMethodSpec[] = [buildGetAvailCarSpec(params)];

  const airportToPoint = buildDestinationAirportToMPointSpec(params);
  if (airportToPoint) specs.push(airportToPoint);

  const pointToAirport = buildDestinationPointToMAirportSpec(params);
  if (pointToAirport) specs.push(pointToAirport);

  return specs;
}

function mergeOffers(primary: TransferOffer[], secondary: TransferOffer[]): TransferOffer[] {
  const seen = new Set<string>();
  const merged: TransferOffer[] = [];

  for (const offer of [...primary, ...secondary]) {
    const key = `${offer.id}:${offer.price}:${offer.currency}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(offer);
  }

  return merged;
}

async function fetchOffersFromSpec(spec: SearchMethodSpec): Promise<TransferOffer[]> {
  const config = getIntuiConfig();
  const payload = await postIntuiMethod<Record<string, unknown>>(spec.endpoint, {
    ...spec.params,
    ...(config.partnerId ? { partnerID: config.partnerId } : {}),
  });
  return mapIntuiTransferOffers(payload);
}

export async function searchTransfers(params: TransferSearchParams): Promise<TransferSearchResult> {
  if (!isIntuiConfigured()) {
    return { offers: [], source: "unconfigured" };
  }

  const specs = buildSearchSpecs(params);
  let offers: TransferOffer[] = [];
  let lastError: string | undefined;

  for (const spec of specs) {
    try {
      const batch = await fetchOffersFromSpec(spec);
      offers = mergeOffers(offers, batch);
      if (offers.length > 0) break;
    } catch (error) {
      if (error instanceof IntuiError) {
        if (error.status === "not_configured") {
          return { offers: [], source: "unconfigured" };
        }
        if (error.status === "authorization_error") {
          return {
            offers: [],
            source: "error",
            error: "Intui API authorization failed — проверьте INTUI_API_KEY",
          };
        }
        if (error.status === "wrong_params" || error.status === "err_url") {
          lastError = error.message;
          continue;
        }
      }
      lastError = error instanceof Error ? error.message : "Transfer search failed";
    }
  }

  if (offers.length > 0) {
    return { offers, source: "intui" };
  }

  return {
    offers: [],
    source: lastError ? "error" : "intui",
    error: lastError,
  };
}

type LocationSearchResult = {
  id?: string;
  name?: string;
  type?: string;
  iata?: string;
  code?: string;
  lat?: number | string;
  lng?: number | string;
  latitude?: number | string;
  longitude?: number | string;
  country?: string;
  country_name?: string;
};

function mapLocationSearchItem(item: LocationSearchResult, index: number): TransferLocation | null {
  const name = readString(item.name);
  if (!name) return null;

  const code = readString(item.iata) ?? readString(item.code);
  const lat = readNumber(item.lat) ?? readNumber(item.latitude);
  const lng = readNumber(item.lng) ?? readNumber(item.longitude);
  const type = code && lat == null && lng == null ? "airport" : lat != null && lng != null ? "point" : code ? "airport" : "point";

  return {
    id: readString(item.id) ?? `${type}-${code ?? name}-${index}`,
    name,
    type,
    code,
    lat,
    lng,
    countryName: readString(item.country_name) ?? readString(item.country),
  };
}

export async function searchIntuiLocations(
  term: string,
  lang: string
): Promise<TransferLocation[]> {
  if (!isIntuiConfigured() || term.trim().length < 2) return [];

  try {
    const config = getIntuiConfig();
    const payload = await postIntuiMethod<Record<string, unknown>>("LocationSearch", {
      term: term.trim(),
      lang: lang || config.defaultLang,
      ...(config.partnerId ? { partnerID: config.partnerId } : {}),
    });

    const rawItems = extractIntuiOfferArray(payload) as LocationSearchResult[];
    const seen = new Set<string>();
    const results: TransferLocation[] = [];

    for (const [index, item] of rawItems.entries()) {
      const location = mapLocationSearchItem(item as LocationSearchResult, index);
      if (!location) continue;
      const key = `${location.type}:${location.code ?? ""}:${location.lat ?? ""}:${location.lng ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(location);
      if (results.length >= 8) break;
    }

    return results;
  } catch {
    return [];
  }
}
