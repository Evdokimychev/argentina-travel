import "server-only";

import { randomUUID } from "node:crypto";
import { isSputnik8Configured } from "@/lib/sputnik8/env";
import {
  fetchSputnik8EventOrderOptions,
  fetchSputnik8Events,
  Sputnik8ApiError,
} from "@/lib/sputnik8/client";
import type { Sputnik8Event, Sputnik8OrderRequest, Sputnik8OrderResponse } from "@/lib/sputnik8/types";
import type { ExcursionScheduleDate } from "@/lib/excursion-schedule";
import { normalizeScheduleTime } from "@/lib/excursion-schedule";

export class Sputnik8BookingError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, details: unknown = null) {
    super(message);
    this.name = "Sputnik8BookingError";
    this.status = status;
    this.details = details;
  }
}

async function sputnik8BookingFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { getSputnik8Config } = await import("@/lib/sputnik8/env");
  const { apiKey, username, apiBase } = getSputnik8Config();
  const separator = path.includes("?") ? "&" : "?";
  const authQuery = `api_key=${encodeURIComponent(apiKey)}&username=${encodeURIComponent(username)}`;
  const url = `${apiBase}${path}${separator}${authQuery}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string> | undefined),
    },
    cache: "no-store",
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Sputnik8BookingError(
      `Sputnik8 booking API failed (${response.status})`,
      response.status,
      body
    );
  }

  return body as T;
}

function parseEventDateTime(event: Sputnik8Event): { date?: string; time?: string } {
  if (event.date && event.time) {
    return { date: event.date, time: normalizeScheduleTime(event.time) };
  }

  const raw = event.datetime ?? event.starts_at;
  if (!raw) return {};

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return {};

  const date = raw.slice(0, 10);
  const time = `${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}`;
  return { date, time };
}

export function parseSputnik8Schedule(events: Sputnik8Event[]): {
  dates: ExcursionScheduleDate[];
  maxPersons?: number;
} {
  const byDate = new Map<string, ExcursionScheduleDate>();

  for (const event of events) {
    if (event.available === false || event.is_available === false) continue;

    const { date, time } = parseEventDateTime(event);
    if (!date || !time) continue;

    const entry = byDate.get(date) ?? { date, slots: [] };
    const price =
      event.price && typeof event.price === "object"
        ? event.price
        : typeof event.price === "number"
          ? { value: event.price }
          : undefined;

    entry.slots.push({
      time,
      priceValue: price?.value,
      priceText: price?.value_string,
    });
    byDate.set(date, entry);
  }

  const dates = [...byDate.values()]
    .map((entry) => ({
      ...entry,
      slots: entry.slots.sort((a, b) => a.time.localeCompare(b.time)),
    }))
    .filter((entry) => entry.slots.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  const maxPersons = events.find((event) => event.max_persons != null)?.max_persons;

  return { dates, maxPersons };
}

export async function fetchSputnik8ProductSchedule(productId: number) {
  if (!isSputnik8Configured()) {
    throw new Sputnik8BookingError("Sputnik8 is not configured", 503);
  }

  const events = await fetchSputnik8Events(productId);
  return parseSputnik8Schedule(events);
}

export async function fetchSputnik8EventPriceOptions(eventId: number) {
  if (!isSputnik8Configured()) {
    throw new Sputnik8BookingError("Sputnik8 is not configured", 503);
  }

  return fetchSputnik8EventOrderOptions(eventId);
}

export async function createSputnik8Order(
  payload: Sputnik8OrderRequest,
  idempotencyKey = randomUUID()
): Promise<Sputnik8OrderResponse> {
  if (!isSputnik8Configured()) {
    throw new Sputnik8BookingError("Sputnik8 is not configured", 503);
  }

  return sputnik8BookingFetch<Sputnik8OrderResponse>("/orders", {
    method: "POST",
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });
}

export { Sputnik8ApiError };
