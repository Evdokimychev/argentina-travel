import type { YouTravelApiEnvelope } from "@/lib/youtravel/types";

export function unwrapYouTravelList<T>(body: unknown): T[] {
  if (!body) return [];
  if (Array.isArray(body)) return body as T[];

  const envelope = body as YouTravelApiEnvelope<T[] | T>;
  const candidates = [envelope.data, envelope.items, envelope.tours, envelope.offers];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate != null && typeof candidate === "object") {
      return [candidate as T];
    }
  }

  return [];
}

export function unwrapYouTravelItem<T>(body: unknown): T | null {
  if (!body) return null;
  if (Array.isArray(body)) return (body[0] as T) ?? null;

  const envelope = body as YouTravelApiEnvelope<T>;
  if (envelope.data != null && !Array.isArray(envelope.data)) {
    return envelope.data;
  }

  return (body as T) ?? null;
}

export function isYouTravelAuthFailure(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const envelope = body as YouTravelApiEnvelope<unknown>;
  if (envelope.success === false && unwrapYouTravelList(envelope).length === 0) {
    return true;
  }
  return false;
}
