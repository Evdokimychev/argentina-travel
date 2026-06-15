import "server-only";

import { randomUUID } from "node:crypto";
import { getTripsterAccessToken, clearTripsterTokenCache } from "@/lib/tripster/auth";
import { getTripsterConfig } from "@/lib/tripster/env";
import type {
  TripsterExternalOrderRequest,
  TripsterExternalOrderResponse,
  TripsterPriceQuote,
  TripsterScheduleResponse,
} from "@/lib/tripster/types";

export class TripsterBookingError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, details: unknown = null) {
    super(message);
    this.name = "TripsterBookingError";
    this.status = status;
    this.details = details;
  }
}

function partnerBasePath(): string {
  const { partner, apiBase } = getTripsterConfig();
  return `${apiBase}/partners/${encodeURIComponent(partner)}`;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function tripsterFetch<T>(path: string, init?: RequestInit, retryOnAuth = true): Promise<T> {
  const token = await getTripsterAccessToken(!retryOnAuth);
  const response = await fetch(`${partnerBasePath()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (response.status === 401 && retryOnAuth) {
    clearTripsterTokenCache();
    return tripsterFetch<T>(path, init, false);
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new TripsterBookingError(
      `Tripster booking API failed (${response.status})`,
      response.status,
      body
    );
  }

  return body as T;
}

export async function fetchTripsterSchedule(experienceId: number): Promise<TripsterScheduleResponse> {
  return tripsterFetch<TripsterScheduleResponse>(`/experiences/${experienceId}/schedule/`);
}

export type TripsterPriceParams = {
  personsCount: number;
  date: string;
  time: string;
  tickets?: Array<{ id: number; count: number }>;
};

export async function fetchTripsterPriceQuote(
  experienceId: number,
  params: TripsterPriceParams
): Promise<TripsterPriceQuote> {
  const ticketsJson = params.tickets?.length ? JSON.stringify(params.tickets) : undefined;
  const query = buildQuery({
    persons_count: params.personsCount,
    date: params.date,
    time: params.time,
    tickets: ticketsJson,
  });

  return tripsterFetch<TripsterPriceQuote>(`/experiences/${experienceId}/price/${query}`);
}

export async function createTripsterExternalOrder(
  payload: TripsterExternalOrderRequest,
  idempotencyKey = randomUUID()
): Promise<TripsterExternalOrderResponse> {
  return tripsterFetch<TripsterExternalOrderResponse>("/external_orders/", {
    method: "POST",
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });
}
