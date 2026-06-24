import "server-only";

import { buildYouTravelAuthHeader } from "@/lib/youtravel/auth";
import { getYouTravelConfig } from "@/lib/youtravel/env";

export type YouTravelBookingRequestPayload = {
  tourId: number;
  offerId?: number | null;
  startDate: string;
  endDate?: string | null;
  personsCount: number;
  name: string;
  email: string;
  phone: string;
  message?: string;
};

export type YouTravelBookingResponse = {
  id?: string | number;
  status?: string;
  url?: string;
  price?: unknown;
};

export type YouTravelBookingOrderView = {
  id: string;
  status: string;
  url: string | null;
  price: unknown;
};

export type YouTravelBookingEndpointProbe = {
  path: string;
  status: number;
  reachable: boolean;
};

export class YouTravelBookingError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, details: unknown = null) {
    super(message);
    this.name = "YouTravelBookingError";
    this.status = status;
    this.details = details;
  }
}

const BOOKING_ENDPOINTS = ["/v1/booking-requests", "/v1/orders"];

const PROBE_PAYLOAD = {
  tour_id: 0,
  start_date: "invalid",
  persons_count: 0,
  name: "",
  email: "invalid",
  phone: "",
};

function buildBookingAuthHeaders() {
  const config = getYouTravelConfig();
  return buildYouTravelAuthHeader({
    mode: config.authMode,
    email: config.email,
    password: config.password,
    apiKey: config.apiKey,
  });
}

function isReachableBookingProbeStatus(status: number): boolean {
  return status === 401 || status === 422 || status === 400;
}

function normalizeOrderView(body: unknown, fallbackId: string): YouTravelBookingOrderView | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const nested =
    record.data && typeof record.data === "object"
      ? (record.data as Record<string, unknown>)
      : record;

  const idRaw = nested.id ?? record.id ?? fallbackId;
  const statusRaw = nested.status ?? record.status;
  const urlRaw = nested.url ?? record.url ?? nested.order_url ?? record.order_url;
  const priceRaw = nested.price ?? record.price ?? nested.price_snapshot ?? record.price_snapshot;

  if (idRaw == null && statusRaw == null) return null;

  return {
    id: String(idRaw ?? fallbackId),
    status: typeof statusRaw === "string" && statusRaw.trim() ? statusRaw.trim() : "unknown",
    url: typeof urlRaw === "string" && urlRaw.trim() ? urlRaw.trim() : null,
    price: priceRaw ?? null,
  };
}

async function youtravelBookingFetch<T>(
  path: string,
  payload: YouTravelBookingRequestPayload
): Promise<T> {
  const config = getYouTravelConfig();
  const authHeaders = buildBookingAuthHeaders();

  const body = {
    tour_id: payload.tourId,
    offer_id: payload.offerId ?? undefined,
    start_date: payload.startDate,
    end_date: payload.endDate ?? undefined,
    persons_count: payload.personsCount,
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    message: payload.message ?? undefined,
  };

  const response = await fetch(`${config.apiBase}${path}`, {
    method: "POST",
    headers: {
      ...authHeaders,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    throw new YouTravelBookingError(
      `YouTravel booking API failed (${response.status})`,
      response.status,
      responseBody
    );
  }

  return responseBody as T;
}

async function youtravelBookingGet(path: string): Promise<{ status: number; body: unknown }> {
  const config = getYouTravelConfig();
  const authHeaders = buildBookingAuthHeaders();

  const response = await fetch(`${config.apiBase}${path}`, {
    method: "GET",
    headers: {
      ...authHeaders,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const body = await response.json().catch(() => null);
  return { status: response.status, body };
}

/**
 * POST minimal invalid payload to each booking endpoint to verify reachability.
 * 401/422/400 indicate auth or validation (endpoint exists); 404 means missing.
 */
export async function probeYouTravelBookingEndpoints(): Promise<YouTravelBookingEndpointProbe[]> {
  const config = getYouTravelConfig();
  const authHeaders = buildBookingAuthHeaders();
  const results: YouTravelBookingEndpointProbe[] = [];

  for (const path of BOOKING_ENDPOINTS) {
    const response = await fetch(`${config.apiBase}${path}`, {
      method: "POST",
      headers: {
        ...authHeaders,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(PROBE_PAYLOAD),
      cache: "no-store",
    });

    const status = response.status;
    results.push({
      path,
      status,
      reachable: response.ok || isReachableBookingProbeStatus(status),
    });
  }

  return results;
}

/**
 * Fetches order status from YouTravel booking API.
 * Tries GET /v1/booking-requests/{id} then /v1/orders/{id}.
 */
export async function fetchYouTravelBookingOrder(
  orderId: string
): Promise<YouTravelBookingOrderView> {
  const trimmedId = orderId.trim();
  if (!trimmedId) {
    throw new YouTravelBookingError("YouTravel order id is required", 400, null);
  }

  const paths = [`/v1/booking-requests/${encodeURIComponent(trimmedId)}`, `/v1/orders/${encodeURIComponent(trimmedId)}`];
  let lastError: YouTravelBookingError | null = null;

  for (const path of paths) {
    const { status, body } = await youtravelBookingGet(path);

    if (status === 404) {
      lastError = new YouTravelBookingError(
        `YouTravel booking order not found (${path})`,
        404,
        body
      );
      continue;
    }

    if (!responseOk(status)) {
      lastError = new YouTravelBookingError(
        `YouTravel booking order fetch failed (${status})`,
        status,
        body
      );
      if (status === 401) {
        throw lastError;
      }
      continue;
    }

    const order = normalizeOrderView(body, trimmedId);
    if (order) {
      return order;
    }

    lastError = new YouTravelBookingError(
      "YouTravel booking order response is empty",
      502,
      body
    );
  }

  if (lastError) {
    throw lastError;
  }

  throw new YouTravelBookingError("YouTravel booking order fetch unavailable", 503, null);
}

function responseOk(status: number): boolean {
  return status >= 200 && status < 300;
}

/**
 * Tries documented YouTravel booking endpoints if available.
 * Callers should fall back to affiliate flow on 401/404.
 */
export async function createYouTravelBookingRequest(
  payload: YouTravelBookingRequestPayload
): Promise<YouTravelBookingResponse> {
  let lastError: YouTravelBookingError | null = null;

  for (const path of BOOKING_ENDPOINTS) {
    try {
      const result = await youtravelBookingFetch<YouTravelBookingResponse>(path, payload);
      return result;
    } catch (error) {
      if (error instanceof YouTravelBookingError) {
        lastError = error;
        if (error.status === 401 || error.status === 404) {
          continue;
        }
        throw error;
      }
      throw error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new YouTravelBookingError("YouTravel booking API unavailable", 503, null);
}
