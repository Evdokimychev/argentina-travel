import "server-only";

import { buildYouTravelAuthHeader } from "@/lib/youtravel/auth";
import { getYouTravelConfig } from "@/lib/youtravel/env";
import { isYouTravelAuthFailure, unwrapYouTravelList } from "@/lib/youtravel/response";
import type {
  YouTravelListParams,
  YouTravelOffer,
  YouTravelTour,
} from "@/lib/youtravel/types";

const MAX_TAKE = 1000;
const RATE_LIMIT_WINDOW_MS = 10_000;
const RATE_LIMIT_MAX_CALLS = 100;

let windowStartedAt = Date.now();
let callsInWindow = 0;

export class YouTravelApiError extends Error {
  readonly status: number;
  readonly path: string;

  constructor(message: string, status: number, path: string) {
    super(message);
    this.name = "YouTravelApiError";
    this.status = status;
    this.path = path;
  }
}

async function throttleYouTravelRequest(): Promise<void> {
  const now = Date.now();
  if (now - windowStartedAt >= RATE_LIMIT_WINDOW_MS) {
    windowStartedAt = now;
    callsInWindow = 0;
  }

  if (callsInWindow >= RATE_LIMIT_MAX_CALLS) {
    const waitMs = RATE_LIMIT_WINDOW_MS - (now - windowStartedAt) + 50;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    windowStartedAt = Date.now();
    callsInWindow = 0;
  }

  callsInWindow += 1;
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

async function youtravelFetch<T>(path: string, retryOn429 = true): Promise<T> {
  await throttleYouTravelRequest();

  const config = getYouTravelConfig();
  const authHeaders = buildYouTravelAuthHeader({
    mode: config.authMode,
    email: config.email,
    password: config.password,
    apiKey: config.apiKey,
  });
  const response = await fetch(`${config.apiBase}${path}`, {
    headers: {
      ...authHeaders,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (response.status === 429 && retryOn429) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_WINDOW_MS + 100));
    return youtravelFetch<T>(path, false);
  }

  const body = (await response.json().catch(() => null)) as T | null;

  if (!response.ok) {
    throw new YouTravelApiError(
      `YouTravel API request failed (${response.status})`,
      response.status,
      path
    );
  }

  if (body == null) {
    throw new YouTravelApiError("YouTravel API returned empty response", response.status, path);
  }

  if (isYouTravelAuthFailure(body)) {
    throw new YouTravelApiError(
      "YouTravel API auth failed — check YOUTRAVEL_API_EMAIL and credentials",
      401,
      path
    );
  }

  return body;
}

export async function fetchYouTravelTours(
  params: YouTravelListParams
): Promise<YouTravelTour[]> {
  const take = Math.min(Math.max(params.take, 1), MAX_TAKE);
  const skip = Math.max(params.skip ?? 0, 0);
  const path = `/v1/tours${buildQuery({ take, skip })}`;
  const body = await youtravelFetch<unknown>(path);
  return unwrapYouTravelList<YouTravelTour>(body);
}

export async function fetchAllYouTravelTours(options?: {
  pageSize?: number;
  maxPages?: number;
}): Promise<YouTravelTour[]> {
  const pageSize = Math.min(options?.pageSize ?? 200, MAX_TAKE);
  const maxPages = options?.maxPages ?? 50;
  const all: YouTravelTour[] = [];

  for (let page = 0; page < maxPages; page += 1) {
    const batch = await fetchYouTravelTours({ take: pageSize, skip: page * pageSize });
    if (!batch.length) break;
    all.push(...batch);
    if (batch.length < pageSize) break;
  }

  return all;
}

export async function fetchYouTravelTourOffers(
  tourId: number | string
): Promise<YouTravelOffer[]> {
  const path = `/v1/tours/${encodeURIComponent(String(tourId))}/offers`;
  const body = await youtravelFetch<unknown>(path);
  return unwrapYouTravelList<YouTravelOffer>(body);
}
