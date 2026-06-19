import { COOKIE_CONSENT_EVENT, hasCookieConsent } from "@/lib/cookie-consent";

/**
 * E79 stub — E80 расширит категории согласия (аналитика / персонализация).
 * Сейчас персонализация привязана к общему баннеру cookies.
 */
export function hasInteractionTrackingConsent(): boolean {
  return hasCookieConsent();
}

export { COOKIE_CONSENT_EVENT };
