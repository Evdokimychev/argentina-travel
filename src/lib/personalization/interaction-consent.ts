import { COOKIE_CONSENT_EVENT, hasPersonalizationConsent } from "@/lib/cookie-consent";

/** Персонализация и interaction-tracking — только при явном согласии на категорию. */
export function hasInteractionTrackingConsent(): boolean {
  return hasPersonalizationConsent();
}

export { COOKIE_CONSENT_EVENT };
