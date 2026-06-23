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

async function youtravelBookingFetch<T>(
  path: string,
  payload: YouTravelBookingRequestPayload
): Promise<T> {
  const config = getYouTravelConfig();
  const authHeaders = buildYouTravelAuthHeader({
    mode: config.authMode,
    email: config.email,
    password: config.password,
    apiKey: config.apiKey,
  });

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
