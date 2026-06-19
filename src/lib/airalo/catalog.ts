import "server-only";

import fs from "node:fs/promises";

import { getAiraloConfig, isAiraloFeedConfigured } from "@/lib/airalo/env";
import { extractDestinationUrl, parseAiraloFeedXml } from "@/lib/airalo/feed-parser";
import { summarizeEsimOffers } from "@/lib/airalo/offer-meta";
import type { EsimCatalogResult, EsimOffer } from "@/lib/airalo/types";

type FeedCache = {
  loadedAt: number;
  offers: EsimOffer[];
};

let feedCache: FeedCache | null = null;

async function readFeedXml(): Promise<string> {
  const config = getAiraloConfig();

  if (config.feedPath) {
    try {
      return await fs.readFile(config.feedPath, "utf8");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to read local Airalo feed";
      throw new Error(message);
    }
  }

  if (!config.feedUrl) {
    throw new Error("AIRALO_FEED_URL is not configured");
  }

  const response = await fetch(config.feedUrl, {
    next: { revalidate: Math.max(60, Math.floor(config.cacheTtlMs / 1000)) },
  });

  if (!response.ok) {
    throw new Error(`Airalo feed request failed (${response.status})`);
  }

  return response.text();
}

async function loadAllOffers(): Promise<EsimOffer[]> {
  const config = getAiraloConfig();
  const now = Date.now();

  if (feedCache && now - feedCache.loadedAt < config.cacheTtlMs) {
    return feedCache.offers;
  }

  const xml = await readFeedXml();
  const offers = parseAiraloFeedXml(xml);
  feedCache = { loadedAt: now, offers };
  return offers;
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

function offerMatchesCountry(offer: EsimOffer, countrySlug: string, keywords: string[]): boolean {
  const slug = normalizeToken(countrySlug);

  if (offer.countrySlug && normalizeToken(offer.countrySlug) === slug) {
    return true;
  }

  const destinationUrl = extractDestinationUrl(offer.purchaseUrl) ?? offer.purchaseUrl;
  const destination = destinationUrl.toLowerCase();
  if (destination.includes(`/${slug}-esim/`) || destination.includes(`/${slug}-esim`)) {
    return true;
  }

  const haystack = [offer.title, offer.productType].filter(Boolean).join(" ").toLowerCase();
  if (haystack.includes(slug)) return true;
  if (haystack.includes(`${slug}-esim`)) return true;

  return keywords.some((keyword) => haystack.includes(normalizeToken(keyword)));
}

export async function getEsimOffers(input: {
  countrySlug?: string;
  keywords?: string[];
  limit?: number;
}): Promise<EsimCatalogResult> {
  if (!isAiraloFeedConfigured()) {
    return { offers: [], source: "unconfigured", countrySlug: input.countrySlug };
  }

  try {
    let offers = await loadAllOffers();

    if (input.countrySlug) {
      const keywords = input.keywords ?? [input.countrySlug];
      offers = offers.filter((offer) => offerMatchesCountry(offer, input.countrySlug!, keywords));
    }

    offers.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));

    const limit = input.limit;
    const sliced = limit != null && limit > 0 ? offers.slice(0, limit) : offers;
    return {
      offers: sliced,
      source: "feed",
      countrySlug: input.countrySlug,
      summary: summarizeEsimOffers(offers),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load Airalo feed";
    return {
      offers: [],
      source: "error",
      error: message,
      countrySlug: input.countrySlug,
    };
  }
}

export async function getEsimOfferById(id: string): Promise<EsimOffer | undefined> {
  if (!isAiraloFeedConfigured()) return undefined;

  try {
    const offers = await loadAllOffers();
    return offers.find((offer) => offer.id === id);
  } catch {
    return undefined;
  }
}
