import type { BookingAttribution } from "@/types/booking-attribution";

export const FIRST_TOUCH_COOKIE = "pva_ft_attribution";
export const FIRST_TOUCH_STORAGE_KEY = "pva_ft_attribution";
/** Ephemeral pre-consent landing snapshot (UTM/path only) — promoted after personalization consent. */
export const FIRST_TOUCH_PENDING_STORAGE_KEY = "pva_ft_pending";

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 90;
const MAX_COOKIE_VALUE_LENGTH = 4_096;
const MAX_UTM_LENGTH = 160;
const MAX_CAMPAIGN_LENGTH = 240;
const MAX_REFERRER_LENGTH = 500;
const MAX_LANDING_PATH_LENGTH = 500;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type FirstTouchAttributionInput = {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  /** Privacy-safe campaign creative slot — no free-text PII. */
  utmContent?: string | null;
  referrer?: string | null;
  landingPath?: string | null;
  apiKeyId?: string | null;
  capturedAt?: string | null;
};

function normalizeText(
  value: string | null | undefined,
  maxLength: number
): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
}

function normalizeReferrer(referrer: string | null | undefined): string | undefined {
  const trimmed = normalizeText(referrer, MAX_REFERRER_LENGTH);
  if (!trimmed) return undefined;
  try {
    const url = new URL(trimmed);
    if (typeof window !== "undefined" && url.hostname === window.location.hostname) {
      return undefined;
    }
    return trimmed;
  } catch {
    return trimmed;
  }
}

function normalizeApiKeyId(value: string | null | undefined): string | undefined {
  const normalized = normalizeText(value, 36);
  return normalized && UUID_PATTERN.test(normalized) ? normalized : undefined;
}

function normalizeCapturedAt(value: string | null | undefined): string {
  if (typeof value === "string") {
    const normalized = value.trim();
    if (normalized && Number.isFinite(Date.parse(normalized))) return normalized;
  }
  return new Date().toISOString();
}

function safelyDecodeCookieValue(value: string): string | null {
  if (!value || value.length > MAX_COOKIE_VALUE_LENGTH) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function encodeCookieAttribution(attribution: BookingAttribution): string | null {
  const candidate = { ...attribution };
  const reducibleFields: Array<
    keyof Pick<
      BookingAttribution,
      "referrer" | "landingPath" | "utmCampaign" | "utmMedium" | "utmSource"
    >
  > = ["referrer", "landingPath", "utmCampaign", "utmMedium", "utmSource"];

  for (const field of reducibleFields) {
    while (candidate[field]) {
      const encoded = encodeURIComponent(serializeFirstTouchAttribution(candidate));
      if (encoded.length <= MAX_COOKIE_VALUE_LENGTH) return encoded;

      const current = candidate[field];
      if (!current) break;
      if (current.length <= 32) {
        delete candidate[field];
      } else {
        candidate[field] = current.slice(0, Math.max(32, Math.floor(current.length / 2)));
      }
    }
  }

  const encoded = encodeURIComponent(serializeFirstTouchAttribution(candidate));
  return encoded.length <= MAX_COOKIE_VALUE_LENGTH ? encoded : null;
}

export function buildFirstTouchAttribution(
  input: FirstTouchAttributionInput
): BookingAttribution | null {
  const attribution: BookingAttribution = {
    utmSource: normalizeText(input.utmSource, MAX_UTM_LENGTH),
    utmMedium: normalizeText(input.utmMedium, MAX_UTM_LENGTH),
    utmCampaign: normalizeText(input.utmCampaign, MAX_CAMPAIGN_LENGTH),
    utmContent: normalizeText(input.utmContent, MAX_UTM_LENGTH),
    referrer: normalizeReferrer(input.referrer),
    landingPath: normalizeText(input.landingPath, MAX_LANDING_PATH_LENGTH),
    apiKeyId: normalizeApiKeyId(input.apiKeyId),
    capturedAt: normalizeCapturedAt(input.capturedAt),
  };

  const hasData =
    attribution.utmSource ||
    attribution.utmMedium ||
    attribution.utmCampaign ||
    attribution.utmContent ||
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
      utmContent: parsed.utmContent,
      referrer: parsed.referrer,
      landingPath: parsed.landingPath,
      apiKeyId: parsed.apiKeyId,
      capturedAt: parsed.capturedAt,
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
  const raw = safelyDecodeCookieValue(entry.slice(prefix.length));
  if (!raw) return null;
  return parseFirstTouchAttribution(raw);
}

export function persistFirstTouchAttribution(attribution: BookingAttribution): void {
  if (typeof window === "undefined") return;
  const normalized = buildFirstTouchAttribution(attribution);
  if (!normalized) return;
  const serialized = serializeFirstTouchAttribution(normalized);
  window.sessionStorage.setItem(FIRST_TOUCH_STORAGE_KEY, serialized);
  const encodedCookie = encodeCookieAttribution(normalized);
  if (encodedCookie) {
    document.cookie = `${FIRST_TOUCH_COOKIE}=${encodedCookie}; path=/; max-age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax`;
  }
}

export function clearFirstTouchAttribution(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(FIRST_TOUCH_STORAGE_KEY);
  document.cookie = `${FIRST_TOUCH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

/** Snapshot landing UTMs before consent so late grant does not lose first-touch. */
export function rememberPendingFirstTouch(searchParams: URLSearchParams): void {
  if (typeof window === "undefined") return;
  if (getStoredFirstTouchAttribution()) return;
  const attribution = buildFirstTouchAttribution({
    utmSource: searchParams.get("utm_source"),
    utmMedium: searchParams.get("utm_medium"),
    utmCampaign: searchParams.get("utm_campaign"),
    utmContent: searchParams.get("utm_content"),
    referrer: document.referrer,
    landingPath: `${window.location.pathname}${window.location.search}`,
    apiKeyId: searchParams.get("api_key_id") ?? searchParams.get("partner_key"),
  });
  if (!attribution) return;
  try {
    window.sessionStorage.setItem(
      FIRST_TOUCH_PENDING_STORAGE_KEY,
      serializeFirstTouchAttribution(attribution),
    );
  } catch {
    /* ignore */
  }
}

export function consumePendingFirstTouch(): BookingAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(FIRST_TOUCH_PENDING_STORAGE_KEY);
    window.sessionStorage.removeItem(FIRST_TOUCH_PENDING_STORAGE_KEY);
    return parseFirstTouchAttribution(raw);
  } catch {
    return null;
  }
}

export function clearPendingFirstTouch(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(FIRST_TOUCH_PENDING_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Read stored first-touch (sessionStorage first, then cookie). */
export function getStoredFirstTouchAttribution(): BookingAttribution | null {
  return readFirstTouchFromStorage() ?? readFirstTouchFromDocumentCookie();
}

export function captureFirstTouchFromLocation(searchParams: URLSearchParams): BookingAttribution | null {
  if (typeof window === "undefined") return null;

  const existing = getStoredFirstTouchAttribution();
  if (existing) return existing;

  const pending = consumePendingFirstTouch();
  if (pending) {
    persistFirstTouchAttribution(pending);
    return pending;
  }

  const utmSource = searchParams.get("utm_source");
  const utmMedium = searchParams.get("utm_medium");
  const utmCampaign = searchParams.get("utm_campaign");
  const utmContent = searchParams.get("utm_content");
  const apiKeyId = searchParams.get("api_key_id") ?? searchParams.get("partner_key");

  const attribution = buildFirstTouchAttribution({
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
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
  const raw = safelyDecodeCookieValue(entry.slice(prefix.length));
  if (!raw) return null;
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
    utmContent: searchParams.get("utm_content"),
    referrer: referrer ?? undefined,
    landingPath,
    apiKeyId: searchParams.get("api_key_id") ?? searchParams.get("partner_key"),
  });
}
