import type { YouTravelApiEnvelope } from "@/lib/youtravel/types";

function unwrapNestedData<T>(data: unknown): T[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  for (const key of ["items", "offers", "tours", "reviews"]) {
    if (Array.isArray(record[key])) return record[key] as T[];
  }
  if (record.tour && typeof record.tour === "object") return [record.tour as T];
  if (record.id != null) return [data as T];
  return [];
}

export function unwrapYouTravelList<T>(body: unknown): T[] {
  if (!body) return [];
  if (Array.isArray(body)) return body as T[];

  const envelope = body as YouTravelApiEnvelope<T[] | T>;
  const candidates = [
    envelope.data,
    envelope.items,
    envelope.tours,
    envelope.offers,
    envelope.reviews,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate != null && typeof candidate === "object") {
      const nested = unwrapNestedData<T>(candidate);
      if (nested.length) return nested;
    }
  }

  return [];
}

export function unwrapYouTravelItem<T>(body: unknown): T | null {
  if (!body) return null;
  if (Array.isArray(body)) return (body[0] as T) ?? null;

  const envelope = body as YouTravelApiEnvelope<T>;
  if (envelope.data != null && typeof envelope.data === "object") {
    const record = envelope.data as Record<string, unknown>;
    if (record.tour && typeof record.tour === "object") return record.tour as T;
    if (!Array.isArray(envelope.data)) return envelope.data;
  }

  return unwrapYouTravelList<T>(body)[0] ?? null;
}

export function isYouTravelAuthFailure(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const envelope = body as YouTravelApiEnvelope<unknown>;
  if (envelope.success === false && unwrapYouTravelList(envelope).length === 0) {
    return true;
  }
  return false;
}

export function parseYouTravelOfferDate(value: string | undefined | null): string | null {
  if (!value) return null;
  const raw = String(value).trim();
  const dotted = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dotted) return `${dotted[3]}-${dotted[2]}-${dotted[1]}`;
  return raw.slice(0, 10);
}
