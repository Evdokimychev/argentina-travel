import "server-only";

import { buildAiraloCountryLandingUrl } from "@/lib/airalo/affiliate";
import { extractDestinationUrl } from "@/lib/airalo/feed-parser";
import {
  buildAiraloPlanSlugCandidates,
  buildAiraloProductUrl,
} from "@/lib/airalo/offer-meta";
import {
  localizeAiraloUrl,
  rebuildFeedAffiliateDestination,
} from "@/lib/airalo/locale-url";
import type { EsimOffer } from "@/lib/airalo/types";
import type { LocaleCode } from "@/types/locale";

const LIVE_PRODUCT_CACHE_TTL_MS = 60 * 60 * 1000;
const liveProductCache = new Map<string, { url: string; expiresAt: number }>();

function resolveCountrySlug(offer: EsimOffer, fallbackCountrySlug: string): string {
  return offer.countrySlug?.trim() || fallbackCountrySlug;
}

function isCountryCatalogRedirect(location: string, planSlug?: string): boolean {
  const normalized = location.trim().toLowerCase();
  if (!normalized) return false;

  const slug = planSlug?.trim().toLowerCase();
  if (slug && normalized.includes(slug)) return false;

  return /-esim\/?(\?|#|$)/.test(normalized);
}

export async function isAiraloProductUrlLive(
  productUrl: string,
  planSlug?: string
): Promise<boolean> {
  try {
    const response = await fetch(productUrl, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });

    if (response.status === 200) return true;
    if (![301, 302, 307, 308].includes(response.status)) return false;

    const location = response.headers.get("location");
    if (!location) return false;

    return !isCountryCatalogRedirect(location, planSlug);
  } catch {
    return false;
  }
}

async function resolveLiveProductUrl(input: {
  offer: EsimOffer;
  countrySlug: string;
  locale: LocaleCode;
}): Promise<string | null> {
  const cacheKey = `${input.offer.id}:${input.countrySlug}:${input.locale}`;
  const cached = liveProductCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  const country = resolveCountrySlug(input.offer, input.countrySlug);
  const candidates = buildAiraloPlanSlugCandidates(input.offer);

  for (const planSlug of candidates) {
    const productUrl = localizeAiraloUrl(buildAiraloProductUrl(country, planSlug), input.locale);
    if (await isAiraloProductUrlLive(productUrl, planSlug)) {
      liveProductCache.set(cacheKey, {
        url: productUrl,
        expiresAt: Date.now() + LIVE_PRODUCT_CACHE_TTL_MS,
      });
      return productUrl;
    }
  }

  const feedProductUrl = extractDestinationUrl(input.offer.purchaseUrl);
  if (feedProductUrl) {
    const localized = localizeAiraloUrl(feedProductUrl, input.locale);
    const feedSlug = localized.split("/").filter(Boolean).pop();
    if (await isAiraloProductUrlLive(localized, feedSlug)) {
      liveProductCache.set(cacheKey, {
        url: localized,
        expiresAt: Date.now() + LIVE_PRODUCT_CACHE_TTL_MS,
      });
      return localized;
    }
  }

  return null;
}

/** Prefer feed affiliate URL (prodsku) with a live Airalo product destination. */
export async function resolveEsimOfferBookingUrl(input: {
  offer: EsimOffer;
  countrySlug: string;
  locale: LocaleCode;
}): Promise<string> {
  const country = resolveCountrySlug(input.offer, input.countrySlug);
  const catalogUrl = buildAiraloCountryLandingUrl(country, input.locale);
  const liveProductUrl = await resolveLiveProductUrl(input);

  if (liveProductUrl) {
    return rebuildFeedAffiliateDestination(input.offer.purchaseUrl, liveProductUrl, input.locale);
  }

  return rebuildFeedAffiliateDestination(input.offer.purchaseUrl, catalogUrl, input.locale);
}
