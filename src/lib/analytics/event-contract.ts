export const ANALYTICS_EVENT_VERSION = 3;
export const ANALYTICS_SESSION_STORAGE_KEY = "goargentina-analytics-session";

export type AnalyticsScalar = string | number | boolean | null | undefined;

export type ProductType = "tour" | "excursion" | "flight" | "article" | "place" | "service";
export type BookingMode =
  | "native_request"
  | "partner_external"
  | "affiliate_redirect"
  | "information_only"
  | "payment_link";
export type BookingOutcome =
  | "started"
  | "native_success"
  | "partner_redirect"
  | "fallback"
  | "error"
  | "cancelled"
  | "confirmed";

export type AnalyticsEnvelope = {
  event_version: number;
  event_id: string;
  session_id?: string;
  occurred_at: string;
};

const PII_VALUE = /(?:[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?\d[\d\s().-]{7,}\d))/i;
const PII_KEY = /(?:^|_)(?:email|phone|telephone|contact|first_name|last_name|full_name|message|comment|address|passport|document)(?:_|$)/i;
const URL_KEY = /(?:^|_)(?:url|href|link)(?:_|$)/i;

function randomId(prefix: "e" | "s"): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid ? `${prefix}-${uuid}` : `${prefix}-${Date.now().toString(36)}`;
}

export function getAnalyticsSessionId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const current = window.sessionStorage.getItem(ANALYTICS_SESSION_STORAGE_KEY);
    if (current) return current;
    const next = randomId("s");
    window.sessionStorage.setItem(ANALYTICS_SESSION_STORAGE_KEY, next);
    return next;
  } catch {
    return undefined;
  }
}

function sanitizeUrl(value: string): string {
  try {
    const parsed = new URL(value, "https://www.goargentina.ru");
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "[redacted]";
    return `${parsed.origin}${parsed.pathname}`.slice(0, 300);
  } catch {
    return "[redacted]";
  }
}

function sanitizeScalar(key: string, value: AnalyticsScalar): AnalyticsScalar {
  if (value === undefined || value === null || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (PII_KEY.test(key)) return "[redacted]";

  const normalized = value.trim().slice(0, 300);
  if (!normalized) return undefined;
  if (URL_KEY.test(key)) return sanitizeUrl(normalized);
  if (PII_VALUE.test(normalized)) return "[redacted]";
  return normalized;
}

/**
 * Analytics accepts flat scalar parameters only. Unknown objects are dropped so
 * form payloads and contact records cannot accidentally leak into a tag manager.
 */
export function sanitizeAnalyticsParams(
  params: Record<string, unknown> = {},
): Record<string, AnalyticsScalar> {
  const sanitized: Record<string, AnalyticsScalar> = {};
  for (const [key, rawValue] of Object.entries(params)) {
    if (!/^[a-z][a-z0-9_]{0,79}$/.test(key)) continue;
    if (
      rawValue !== null &&
      rawValue !== undefined &&
      typeof rawValue !== "string" &&
      typeof rawValue !== "number" &&
      typeof rawValue !== "boolean"
    ) {
      continue;
    }
    const value = sanitizeScalar(key, rawValue as AnalyticsScalar);
    if (value !== undefined) sanitized[key] = value;
  }
  return sanitized;
}

export function createAnalyticsEnvelope(): AnalyticsEnvelope {
  const sessionId = getAnalyticsSessionId();
  return {
    event_version: ANALYTICS_EVENT_VERSION,
    event_id: randomId("e"),
    ...(sessionId ? { session_id: sessionId } : {}),
    occurred_at: new Date().toISOString(),
  };
}

export function createAnalyticsEventPayload(
  params: Record<string, unknown> = {},
): AnalyticsEnvelope & Record<string, AnalyticsScalar> {
  return {
    ...sanitizeAnalyticsParams(params),
    ...createAnalyticsEnvelope(),
  };
}
