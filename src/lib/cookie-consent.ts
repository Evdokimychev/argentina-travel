export const COOKIE_CONSENT_STORAGE_KEY = "site-cookie-consent";
export const COOKIE_CONSENT_COOKIE_NAME = "site-cookie-consent";
export const COOKIE_CONSENT_MAX_AGE = 60 * 60 * 24 * 365;
/** @deprecated Use COOKIE_CONSENT_EVENT */
export const COOKIE_CONSENT_EVENT = "cookie-consent-changed";
export const COOKIE_CONSENT_CHANGED_EVENT = "cookie-consent-changed";

export type CookieConsentCategory = "necessary" | "analytics" | "personalization";

export type CookieConsentPreferences = {
  necessary: true;
  analytics: boolean;
  personalization: boolean;
  decidedAt: string;
};

const DEFAULT_PREFERENCES: CookieConsentPreferences = {
  necessary: true,
  analytics: false,
  personalization: false,
  decidedAt: "",
};

function parseConsentJson(raw: string | null): CookieConsentPreferences | null {
  if (!raw) return null;
  if (raw === "accepted") {
    return {
      necessary: true,
      analytics: true,
      personalization: true,
      decidedAt: new Date(0).toISOString(),
    };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsentPreferences>;
    if (typeof parsed !== "object" || parsed === null) return null;
    return {
      necessary: true,
      analytics: Boolean(parsed.analytics),
      personalization: Boolean(parsed.personalization),
      decidedAt:
        typeof parsed.decidedAt === "string" && parsed.decidedAt
          ? parsed.decidedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function parseCookieConsentValue(
  raw: string | null | undefined
): CookieConsentPreferences | null {
  if (typeof raw !== "string" || !raw) return null;
  const value = raw.trim();
  if (!value) return null;
  try {
    return parseConsentJson(decodeURIComponent(value));
  } catch {
    return parseConsentJson(value);
  }
}

function readFromStorage(): CookieConsentPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    return parseCookieConsentValue(window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY));
  } catch {
    return null;
  }
}

function readFromCookie(): CookieConsentPreferences | null {
  if (typeof document === "undefined") return null;
  try {
    const match = document.cookie.match(
      new RegExp(
        `(?:^|; )${COOKIE_CONSENT_COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`
      )
    );
    const value = match?.[1] ? decodeURIComponent(match[1]) : null;
    return parseCookieConsentValue(value);
  } catch {
    return null;
  }
}

function serializePreferences(preferences: CookieConsentPreferences): string {
  return JSON.stringify(preferences);
}

function persistPreferences(preferences: CookieConsentPreferences): void {
  const serialized = serializePreferences(preferences);
  try {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, serialized);
  } catch {
    /* ignore */
  }
  try {
    document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=${encodeURIComponent(serialized)}; path=/; max-age=${COOKIE_CONSENT_MAX_AGE}; SameSite=Lax`;
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    import("@/lib/analytics/gtm-consent").then(({ syncGtmConsent }) => syncGtmConsent(preferences));
  }
  window.dispatchEvent(new Event(COOKIE_CONSENT_CHANGED_EVENT));
}

export function getCookieConsent(): CookieConsentPreferences | null {
  return readFromStorage() ?? readFromCookie();
}

export function hasCookieConsentDecision(): boolean {
  const preferences = getCookieConsent();
  return Boolean(preferences?.decidedAt);
}

/** @deprecated Use hasAnalyticsConsent or hasCookieConsentDecision */
export function hasCookieConsent(): boolean {
  return hasCookieConsentDecision();
}

export function hasAnalyticsConsent(): boolean {
  return getCookieConsent()?.analytics === true;
}

export function hasAnalyticsConsentFromCookieValue(raw: string | null | undefined): boolean {
  return parseCookieConsentValue(raw)?.analytics === true;
}

export function hasPersonalizationConsent(): boolean {
  return getCookieConsent()?.personalization === true;
}

export function saveCookieConsent(input: {
  analytics: boolean;
  personalization: boolean;
}): CookieConsentPreferences {
  const preferences: CookieConsentPreferences = {
    necessary: true,
    analytics: input.analytics,
    personalization: input.personalization,
    decidedAt: new Date().toISOString(),
  };
  persistPreferences(preferences);
  return preferences;
}

export function acceptAllCookieConsent(): CookieConsentPreferences {
  return saveCookieConsent({ analytics: true, personalization: true });
}

export function acceptNecessaryOnlyCookieConsent(): CookieConsentPreferences {
  return saveCookieConsent({ analytics: false, personalization: false });
}

/** @deprecated Use saveCookieConsent or acceptAllCookieConsent */
export function acceptCookieConsent(): void {
  acceptAllCookieConsent();
}

export function defaultCookieConsentDraft(): Pick<
  CookieConsentPreferences,
  "analytics" | "personalization"
> {
  const current = getCookieConsent();
  return {
    analytics: current?.analytics ?? DEFAULT_PREFERENCES.analytics,
    personalization: current?.personalization ?? DEFAULT_PREFERENCES.personalization,
  };
}
