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

/**
 * Уникальный идентификатор запроса для заголовка `X-REQUESTID`.
 * Формат из официальной документации External Orders: `{uuid}_{unix_timestamp}`.
 * Запросы с request_id старше 30 минут отклоняются (HTTP 400), поэтому он
 * генерируется непосредственно перед отправкой.
 */
export function buildTripsterRequestId(): string {
  const nowTimestamp = Math.floor(Date.now() / 1000);
  return `${randomUUID()}_${nowTimestamp}`;
}

type TripsterAuthScheme = "Bearer" | "Token";

type TripsterFetchOptions = {
  retryOnAuth?: boolean;
  authScheme?: TripsterAuthScheme;
};

async function tripsterFetch<T>(
  path: string,
  init?: RequestInit,
  options: TripsterFetchOptions = {}
): Promise<T> {
  const { retryOnAuth = true, authScheme = "Bearer" } = options;
  const token = await getTripsterAccessToken(!retryOnAuth);
  const response = await fetch(`${partnerBasePath()}${path}`, {
    ...init,
    headers: {
      Authorization: `${authScheme} ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (response.status === 401 && retryOnAuth) {
    clearTripsterTokenCache();
    return tripsterFetch<T>(path, init, { retryOnAuth: false, authScheme });
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
  idempotencyKey: string = randomUUID(),
  requestId: string = buildTripsterRequestId()
): Promise<TripsterExternalOrderResponse> {
  // Официальная документация External Orders требует заголовки уникальности
  // запроса (`Idempotency-Key`, результат хранится 1 час) и идентификатора
  // запроса (`X-REQUESTID` в формате `{uuid}_{unix_timestamp}`).
  const init: RequestInit = {
    method: "POST",
    headers: {
      "Idempotency-Key": idempotencyKey,
      "X-REQUESTID": requestId,
    },
    body: JSON.stringify(payload),
  };

  try {
    return await tripsterFetch<TripsterExternalOrderResponse>("/external_orders/", init, {
      authScheme: "Bearer",
    });
  } catch (error) {
    // Документация авторизации (2025) использует `Authorization: Bearer`,
    // но страница создания заказа (2021) показывает `Authorization: Token`.
    // На 401/403 повторяем запрос со схемой `Token` для совместимости.
    if (
      error instanceof TripsterBookingError &&
      (error.status === 401 || error.status === 403)
    ) {
      return tripsterFetch<TripsterExternalOrderResponse>("/external_orders/", init, {
        authScheme: "Token",
        retryOnAuth: false,
      });
    }
    throw error;
  }
}
