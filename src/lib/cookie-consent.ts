export const COOKIE_CONSENT_KEY = "site-cookie-consent";
export const COOKIE_CONSENT_EVENT = "cookie-consent-accepted";

export function hasCookieConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(COOKIE_CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}

export function acceptCookieConsent(): void {
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
}
