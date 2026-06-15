import type { LocaleCode } from "@/types/locale";
import { extractDestinationUrl } from "@/lib/airalo/feed-parser";

const AIRALO_LOCALE_SEGMENTS: Record<Exclude<LocaleCode, "en">, string> = {
  ru: "ru",
  es: "es-ES",
  pt: "pt-PT",
};

const AIRALO_LOCALE_PREFIXES = new Set([
  "ru",
  "es",
  "es-es",
  "pt",
  "pt-pt",
  "pt-br",
  "en",
  "en-us",
  "en-gb",
]);

export function resolveAiraloLocaleSegment(locale: LocaleCode): string | null {
  if (locale === "en") return null;
  return AIRALO_LOCALE_SEGMENTS[locale] ?? null;
}

export function localizeAiraloUrl(url: string, locale: LocaleCode): string {
  if (locale === "en") return url;

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("airalo.com")) return url;

    const segment = resolveAiraloLocaleSegment(locale);
    if (!segment) return url;

    const parts = parsed.pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
    if (parts.length > 0 && AIRALO_LOCALE_PREFIXES.has(parts[0].toLowerCase())) {
      parts[0] = segment;
    } else {
      parts.unshift(segment);
    }

    parsed.pathname = `/${parts.join("/")}`;
    return parsed.toString();
  } catch {
    return url;
  }
}

export function rebuildFeedAffiliateDestination(
  feedUrl: string,
  destination: string,
  locale: LocaleCode
): string {
  try {
    const url = new URL(feedUrl);
    url.searchParams.set("u", localizeAiraloUrl(destination, locale));
    return url.toString();
  } catch {
    return feedUrl;
  }
}

export function localizeFeedAffiliateUrl(feedUrl: string, locale: LocaleCode): string {
  const destination = extractDestinationUrl(feedUrl);
  if (!destination) return feedUrl;

  const localizedDestination = localizeAiraloUrl(destination, locale);
  if (localizedDestination === destination) return feedUrl;

  try {
    const url = new URL(feedUrl);
    url.searchParams.set("u", localizedDestination);
    return url.toString();
  } catch {
    return feedUrl;
  }
}

export const AIRALO_HELP_CENTER_URL = "https://www.airalo.com/help";

export const AIRALO_WHATSAPP_SUPPORT_URL =
  "https://api.whatsapp.com/send/?phone=19842247256&text=I%27m+continuing+my+conversation+on+WhatsApp.&type=phone_number&app_absent=0";

export function resolveAiraloHelpCenterUrl(locale: LocaleCode): string {
  return localizeAiraloUrl(AIRALO_HELP_CENTER_URL, locale);
}

export function resolveLocaleFromParam(raw: string | null | undefined): LocaleCode {
  const normalized = raw?.trim().toLowerCase();
  if (normalized === "ru" || normalized === "en" || normalized === "es" || normalized === "pt") {
    return normalized;
  }
  return "ru";
}
