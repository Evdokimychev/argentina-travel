import type { BookingAttribution } from "@/types/booking-attribution";

export const FIRST_TOUCH_COOKIE = "pva_ft_attribution";
export const FIRST_TOUCH_STORAGE_KEY = "pva_ft_attribution";

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 90;

export type FirstTouchAttributionInput = {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrer?: string | null;
  landingPath?: string | null;
  apiKeyId?: string | null;
};

function trimOrUndefined(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function normalizeReferrer(referrer: string | null | undefined): string | undefined {
  const trimmed = trimOrUndefined(referrer);
  if (!trimmed) return undefined;
  try {
    const url = new URL(trimmed);
    if (url.hostname === window.location.hostname) return undefined;
    return trimmed.slice(0, 500);
  } catch {
    return trimmed.slice(0, 500);
  }
}

export function buildFirstTouchAttribution(
  input: FirstTouchAttributionInput
): BookingAttribution | null {
  const attribution: BookingAttribution = {
    utmSource: trimOrUndefined(input.utmSource),
    utmMedium: trimOrUndefined(input.utmMedium),
    utmCampaign: trimOrUndefined(input.utmCampaign),
    referrer: trimOrUndefined(input.referrer),
    landingPath: trimOrUndefined(input.landingPath),
    apiKeyId: trimOrUndefined(input.apiKeyId),
    capturedAt: new Date().toISOString(),
  };

  const hasData =
    attribution.utmSource ||
    attribution.utmMedium ||
    attribution.utmCampaign ||
    attribution.referrer ||
    attribution.landingPath ||
    attribution.apiKeyId;

  return hasData ? attribution : null;
}

export function serializeFirstTouchAttribution(attribution: BookingAttribution): string {
  return JSON.stringify(attribution);
}

export function parseFirstTouchAttribution(raw: string | null | undefined): BookingAttribution | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as BookingAttribution;
    if (!parsed || typeof parsed !== "object") return null;
    return buildFirstTouchAttribution({
      utmSource: parsed.utmSource,
      utmMedium: parsed.utmMedium,
      utmCampaign: parsed.utmCampaign,
      referrer: parsed.referrer,
      landingPath: parsed.landingPath,
      apiKeyId: parsed.apiKeyId,
    });
  } catch {
    return null;
  }
}

export function readFirstTouchFromStorage(): BookingAttribution | null {
  if (typeof window === "undefined") return null;
  return parseFirstTouchAttribution(window.sessionStorage.getItem(FIRST_TOUCH_STORAGE_KEY));
}

export function readFirstTouchFromDocumentCookie(): BookingAttribution | null {
  if (typeof document === "undefined") return null;
  const prefix = `${FIRST_TOUCH_COOKIE}=`;
  const entry = document.cookie.split("; ").find((part) => part.startsWith(prefix));
  if (!entry) return null;
  const raw = decodeURIComponent(entry.slice(prefix.length));
  return parseFirstTouchAttribution(raw);
}

export function persistFirstTouchAttribution(attribution: BookingAttribution): void {
  if (typeof window === "undefined") return;
  const serialized = serializeFirstTouchAttribution(attribution);
  window.sessionStorage.setItem(FIRST_TOUCH_STORAGE_KEY, serialized);
  document.cookie = `${FIRST_TOUCH_COOKIE}=${encodeURIComponent(serialized)}; path=/; max-age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax`;
}

/** Read stored first-touch (sessionStorage first, then cookie). */
export function getStoredFirstTouchAttribution(): BookingAttribution | null {
  return readFirstTouchFromStorage() ?? readFirstTouchFromDocumentCookie();
}

export function captureFirstTouchFromLocation(searchParams: URLSearchParams): BookingAttribution | null {
  if (typeof window === "undefined") return null;

  const existing = getStoredFirstTouchAttribution();
  if (existing) return existing;

  const utmSource = searchParams.get("utm_source");
  const utmMedium = searchParams.get("utm_medium");
  const utmCampaign = searchParams.get("utm_campaign");
  const apiKeyId = searchParams.get("api_key_id") ?? searchParams.get("partner_key");

  const attribution = buildFirstTouchAttribution({
    utmSource,
    utmMedium,
    utmCampaign,
    referrer: document.referrer,
    landingPath: `${window.location.pathname}${window.location.search}`,
    apiKeyId,
  });

  if (attribution) {
    persistFirstTouchAttribution(attribution);
  }

  return attribution;
}

export function parseFirstTouchCookieHeader(cookieHeader: string | null | undefined): BookingAttribution | null {
  if (!cookieHeader) return null;
  const prefix = `${FIRST_TOUCH_COOKIE}=`;
  const entry = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
  if (!entry) return null;
  const raw = decodeURIComponent(entry.slice(prefix.length));
  return parseFirstTouchAttribution(raw);
}

export function buildFirstTouchFromSearchParams(
  searchParams: URLSearchParams,
  landingPath: string,
  referrer?: string | null
): BookingAttribution | null {
  return buildFirstTouchAttribution({
    utmSource: searchParams.get("utm_source"),
    utmMedium: searchParams.get("utm_medium"),
    utmCampaign: searchParams.get("utm_campaign"),
    referrer: referrer ?? undefined,
    landingPath,
    apiKeyId: searchParams.get("api_key_id") ?? searchParams.get("partner_key"),
  });
}
