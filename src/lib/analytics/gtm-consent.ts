import type { CookieConsentPreferences } from "@/lib/cookie-consent";

type ConsentState = "granted" | "denied";

function toConsentState(enabled: boolean): ConsentState {
  return enabled ? "granted" : "denied";
}

function pushGtagConsentCommand(
  command: "default" | "update",
  params: Record<string, ConsentState>
): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(["consent", command, params] as unknown as Record<string, unknown>);
}

/** Sync Google Consent Mode v2 with cookie banner preferences. */
export function syncGtmConsent(preferences: CookieConsentPreferences): void {
  pushGtagConsentCommand("update", {
    analytics_storage: toConsentState(preferences.analytics),
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    functionality_storage: toConsentState(preferences.analytics),
    personalization_storage: toConsentState(preferences.personalization),
    security_storage: "granted",
  });
}

/** Inline bootstrap for `<head>` — must run before GTM container snippet. */
export function buildGtmConsentDefaultScript(): string {
  return `(function(){window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'denied',personalization_storage:'denied',security_storage:'granted',wait_for_update:500});})();`;
}
