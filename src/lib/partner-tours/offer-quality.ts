/**
 * Public Offer Quality Gate — shared publish decision for partner marketplace.
 *
 * Partner API HTTP 200 is never enough for public trust.
 * Pipeline: import → normalize → validate → editorial → classify → publish decision.
 */

import {
  isFutureOrTodayYmd,
  isPastYmd,
  isValidYmd,
  todayYmdInTimeZone,
} from "@/lib/partner-tours/calendar-date";

export {
  isFutureOrTodayYmd,
  isPastYmd,
  isValidYmd,
  todayYmdInTimeZone,
  MARKETPLACE_TIME_ZONE,
} from "@/lib/partner-tours/calendar-date";
import {
  assessPartnerContentQuality,
  type PartnerContentQualityResult,
} from "@/lib/partner-tours/content-quality";
import {
  classifyFeedFreshness,
  type FeedFreshness,
  type FeedFreshnessInput,
} from "@/lib/partner-tours/freshness";
import {
  hasArgentinaCatalogRelevance,
  isDefaultCatalogTour,
  isNeighboringCountryTour,
} from "@/lib/catalog-country-relevance";
import { isPartnerTourListing } from "@/lib/tripster/partner-tour-utils";
import type { TourDate, TourDatePrice, TourListing } from "@/types";

export type OfferPublishState =
  | "publishable"
  | "degraded"
  | "temporarily_unavailable"
  | "quarantined"
  | "rejected";

export type OfferRejectionReason =
  | "MISSING_IDENTITY"
  | "INVALID_SLUG"
  | "PAST_DEPARTURES_ONLY"
  | "NO_BOOKABLE_DEPARTURE"
  | "INVALID_DATE"
  | "INVALID_PRICE"
  | "UNKNOWN_CURRENCY"
  | "PRICE_SCALE_SUSPECT"
  | "CAPACITY_INCONSISTENT"
  | "SOLD_OUT"
  | "BROKEN_BOOKING_TARGET"
  | "STALE_SOURCE"
  | "CRITICALLY_STALE_SOURCE"
  | "MISSING_LOCATION"
  | "IRRELEVANT_DESTINATION"
  | "BROKEN_MEDIA"
  | "CONTENT_LANGUAGE_SUSPECT"
  | "CONTENT_QUALITY_SUSPECT"
  | "DUPLICATE"
  | "PARTNER_DISABLED"
  | "INACTIVE_STATUS";

export type ArgentinaTaxonomy =
  | "argentina"
  | "argentina_cross_border"
  | "south_america_other"
  | "unknown";

export type OfferQualityDecision = {
  state: OfferPublishState;
  reasons: OfferRejectionReason[];
  taxonomy: ArgentinaTaxonomy;
  freshness: FeedFreshness;
  content: PartnerContentQualityResult | null;
  bookableDepartureCount: number;
  /** True when the offer may appear in the default commercial catalog as bookable. */
  showAsBookable: boolean;
  /** True when a detail page may exist (entity useful) even without bookable dates. */
  allowDetailPage: boolean;
};

export type OfferQualityListingInput = {
  listing: Pick<
    TourListing,
    | "id"
    | "slug"
    | "title"
    | "priceUsd"
    | "partnerPriceValue"
    | "partnerPriceCurrency"
    | "partnerSource"
    | "country"
    | "destination"
    | "region"
    | "shortDescription"
    | "availableDates"
    | "image"
    | "partnerThematicTags"
  >;
  /** Detail-level departures when available (preferred over availableDates). */
  departures?: Array<Pick<TourDatePrice, "startDate" | "endDate" | "spotsLeft" | "priceUsd">>;
  bookingTargetUrl?: string | null;
  status?: string | null;
  syncedAt?: string | null;
  now?: Date;
  feed?: FeedFreshnessInput;
  descriptionSample?: string | null;
};

const HARD_REJECT: OfferRejectionReason[] = [
  "MISSING_IDENTITY",
  "INVALID_SLUG",
  "INVALID_PRICE",
  "PRICE_SCALE_SUSPECT",
  "UNKNOWN_CURRENCY",
  "CAPACITY_INCONSISTENT",
  "BROKEN_BOOKING_TARGET",
  "IRRELEVANT_DESTINATION",
  "PARTNER_DISABLED",
  "INACTIVE_STATUS",
  "CRITICALLY_STALE_SOURCE",
];

const QUARANTINE: OfferRejectionReason[] = [
  "CONTENT_QUALITY_SUSPECT",
  "CONTENT_LANGUAGE_SUSPECT",
  "BROKEN_MEDIA",
];

const MIN_SANE_USD = 25;
const MAX_SANE_USD = 15_000;

export function classifyArgentinaTaxonomy(
  listing: OfferQualityListingInput["listing"],
): ArgentinaTaxonomy {
  const asTour = listing as unknown as TourListing;
  if (!isPartnerTourListing(asTour)) {
    if (isDefaultCatalogTour(asTour)) {
      const primary = listing.country?.split(",")[0]?.trim().toLowerCase() ?? "";
      if (primary.includes("аргентин") || primary.includes("argentina")) return "argentina";
      if (hasArgentinaCatalogRelevance(asTour)) return "argentina_cross_border";
      return "argentina";
    }
    return "unknown";
  }

  if (isNeighboringCountryTour(asTour)) return "south_america_other";
  if (!isDefaultCatalogTour(asTour)) {
    if (!listing.country && !hasArgentinaCatalogRelevance(asTour)) return "unknown";
    return "south_america_other";
  }

  const primary = listing.country?.split(",")[0]?.trim().toLowerCase() ?? "";
  if (primary.includes("аргентин") || primary.includes("argentina")) return "argentina";
  if (hasArgentinaCatalogRelevance(asTour)) return "argentina_cross_border";
  return "argentina";
}

export function filterFutureTourDates<T extends { start: string }>(
  dates: T[],
  now: Date = new Date(),
): T[] {
  return dates.filter((date) => isFutureOrTodayYmd(date.start, now));
}

export function filterFutureDepartures<T extends { startDate: string }>(
  dates: T[],
  now: Date = new Date(),
): T[] {
  return dates.filter((date) => isFutureOrTodayYmd(date.startDate, now));
}

function evaluateCapacity(
  spotsLeft: number | null | undefined,
  reasons: OfferRejectionReason[],
): void {
  if (spotsLeft == null) return;
  if (!Number.isFinite(spotsLeft) || spotsLeft < 0) {
    reasons.push("CAPACITY_INCONSISTENT");
  }
}

function evaluatePrice(
  listing: OfferQualityListingInput["listing"],
  reasons: OfferRejectionReason[],
): void {
  const usd = listing.priceUsd;
  if (usd == null || !Number.isFinite(usd) || usd <= 0) {
    reasons.push("INVALID_PRICE");
    return;
  }
  if (usd < MIN_SANE_USD || usd > MAX_SANE_USD) {
    reasons.push("PRICE_SCALE_SUSPECT");
  }

  const currency = listing.partnerPriceCurrency?.trim().toUpperCase();
  if (currency && !["USD", "EUR", "RUB", "ARS", "CLP"].includes(currency)) {
    reasons.push("UNKNOWN_CURRENCY");
  }
}

function evaluateBookingTarget(
  url: string | null | undefined,
  reasons: OfferRejectionReason[],
): void {
  if (url == null || !url.trim()) return;
  const trimmed = url.trim();
  if (trimmed.includes("/lk/pay")) {
    reasons.push("BROKEN_BOOKING_TARGET");
    return;
  }
  if (/^javascript:/i.test(trimmed) || /^data:/i.test(trimmed)) {
    reasons.push("BROKEN_BOOKING_TARGET");
  }
}

function evaluateIdentity(
  listing: OfferQualityListingInput["listing"],
  reasons: OfferRejectionReason[],
): void {
  if (!listing.id?.trim() || !listing.slug?.trim()) {
    reasons.push("MISSING_IDENTITY");
  }
  if (listing.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(listing.slug)) {
    reasons.push("INVALID_SLUG");
  }
}

function collectBookableDepartures(
  input: OfferQualityListingInput,
  now: Date,
): { count: number; pastOnly: boolean; invalidDate: boolean } {
  const fromDetail = input.departures ?? [];
  const fromListing = input.listing.availableDates ?? [];

  let invalidDate = false;
  let pastCount = 0;
  let futureCount = 0;

  for (const departure of fromDetail) {
    if (!isValidYmd(departure.startDate)) {
      invalidDate = true;
      continue;
    }
    if (isPastYmd(departure.startDate, now)) {
      pastCount += 1;
      continue;
    }
    if ((departure.spotsLeft ?? 1) <= 0) continue;
    futureCount += 1;
  }

  if (fromDetail.length === 0) {
    for (const date of fromListing) {
      if (!isValidYmd(date.start)) {
        invalidDate = true;
        continue;
      }
      if (isPastYmd(date.start, now)) {
        pastCount += 1;
        continue;
      }
      if ((date.spotsLeft ?? 1) <= 0) continue;
      futureCount += 1;
    }
  }

  return {
    count: futureCount,
    pastOnly: pastCount > 0 && futureCount === 0,
    invalidDate,
  };
}

function decideState(reasons: OfferRejectionReason[]): OfferPublishState {
  if (reasons.some((reason) => HARD_REJECT.includes(reason))) return "rejected";
  if (reasons.some((reason) => QUARANTINE.includes(reason))) return "quarantined";
  if (reasons.includes("STALE_SOURCE")) return "degraded";
  if (
    reasons.includes("PAST_DEPARTURES_ONLY") ||
    reasons.includes("NO_BOOKABLE_DEPARTURE") ||
    reasons.includes("SOLD_OUT")
  ) {
    return "temporarily_unavailable";
  }
  if (reasons.length > 0) return "degraded";
  return "publishable";
}

/**
 * Evaluate a partner (or platform) listing for public commercial publication.
 */
export function evaluateOfferQuality(input: OfferQualityListingInput): OfferQualityDecision {
  const now = input.now ?? new Date();
  const reasons: OfferRejectionReason[] = [];
  const taxonomy = classifyArgentinaTaxonomy(input.listing);

  evaluateIdentity(input.listing, reasons);

  const status = (input.status ?? "").trim().toLowerCase();
  if (["archived", "deleted", "draft", "inactive", "hidden", "disabled"].includes(status)) {
    reasons.push("INACTIVE_STATUS");
  }

  evaluatePrice(input.listing, reasons);
  evaluateBookingTarget(input.bookingTargetUrl, reasons);

  for (const date of input.listing.availableDates ?? []) {
    evaluateCapacity(date.spotsLeft, reasons);
  }
  for (const departure of input.departures ?? []) {
    evaluateCapacity(departure.spotsLeft, reasons);
  }

  const bookable = collectBookableDepartures(input, now);
  if (bookable.invalidDate) reasons.push("INVALID_DATE");
  if (bookable.pastOnly) reasons.push("PAST_DEPARTURES_ONLY");
  if (bookable.count === 0 && !bookable.pastOnly) {
    const hadAny =
      (input.departures?.length ?? 0) > 0 || (input.listing.availableDates?.length ?? 0) > 0;
    if (hadAny) reasons.push("SOLD_OUT");
    else {
      // Unknown schedule ≠ expired schedule. Keep the entity discoverable as degraded.
      reasons.push("NO_BOOKABLE_DEPARTURE");
    }
  }

  if (isPartnerTourListing(input.listing as unknown as TourListing)) {
    if (taxonomy === "south_america_other") {
      reasons.push("IRRELEVANT_DESTINATION");
    }
    if (taxonomy === "unknown" && !input.listing.country?.trim()) {
      reasons.push("MISSING_LOCATION");
    }
  }

  const feedInput: FeedFreshnessInput = input.feed ?? {
    syncedAt: input.syncedAt ?? null,
    now,
  };
  const freshness = classifyFeedFreshness(feedInput);
  if (freshness === "critical") reasons.push("CRITICALLY_STALE_SOURCE");
  else if (freshness === "stale") reasons.push("STALE_SOURCE");

  let content: PartnerContentQualityResult | null = null;
  const contentSample = input.descriptionSample ?? input.listing.shortDescription ?? null;
  if (contentSample != null && contentSample.trim()) {
    content = assessPartnerContentQuality(contentSample);
    // Auto shortDescription is often brief marketing copy — only hard-block dangerous content.
    // Full editorial scoring uses explicit descriptionSample (detail/audit path).
    const dangerous = content.reasons.filter((reason) =>
      ["script_injection", "entity_garbage", "raw_html"].includes(reason),
    );
    if (dangerous.length > 0) {
      if (dangerous.includes("script_injection") || dangerous.includes("entity_garbage")) {
        reasons.push("CONTENT_QUALITY_SUSPECT");
      }
      if (dangerous.includes("raw_html") && input.descriptionSample != null) {
        reasons.push("CONTENT_QUALITY_SUSPECT");
      }
    } else if (input.descriptionSample != null && !content.ok) {
      if (content.reasons.includes("language_suspect")) {
        reasons.push("CONTENT_LANGUAGE_SUSPECT");
      }
      if (content.reasons.some((r) => r !== "language_suspect")) {
        reasons.push("CONTENT_QUALITY_SUSPECT");
      }
    }
  }

  if (input.listing.image?.trim()) {
    const cover = input.listing.image.trim();
    if (/^javascript:/i.test(cover) || cover.includes("<script")) {
      reasons.push("BROKEN_MEDIA");
    }
  }

  const uniqueReasons = [...new Set(reasons)];
  // Soft "no schedule yet" should not remove the card from the commercial catalog.
  const softOnlyNoSchedule =
    uniqueReasons.length === 1 && uniqueReasons[0] === "NO_BOOKABLE_DEPARTURE";
  const state = softOnlyNoSchedule ? "degraded" : decideState(uniqueReasons);
  const availabilityBlocked =
    uniqueReasons.includes("PAST_DEPARTURES_ONLY") || uniqueReasons.includes("SOLD_OUT");
  const showAsBookable =
    !availabilityBlocked &&
    (state === "publishable" || state === "degraded") &&
    (bookable.count > 0 || uniqueReasons.includes("NO_BOOKABLE_DEPARTURE"));
  const allowDetailPage =
    state !== "rejected" &&
    state !== "quarantined" &&
    !uniqueReasons.includes("MISSING_IDENTITY") &&
    !uniqueReasons.includes("INVALID_SLUG");

  return {
    state,
    reasons: uniqueReasons,
    taxonomy,
    freshness,
    content,
    bookableDepartureCount: bookable.count,
    showAsBookable,
    allowDetailPage,
  };
}

/** Keep only listings that may appear as bookable commercial cards. */
export function filterBookableMarketplaceListings(
  listings: TourListing[],
  options?: { now?: Date; syncedAtById?: Map<string, string | null> },
): TourListing[] {
  const now = options?.now ?? new Date();
  return listings.flatMap((listing) => {
    if (!listing?.id || !listing?.slug) return [];

    const decision = isPartnerTourListing(listing)
      ? evaluateOfferQuality({
          listing,
          syncedAt: options?.syncedAtById?.get(listing.id) ?? null,
          now,
        })
      : null;

    if (decision && !decision.showAsBookable) return [];

    return [
      {
        ...listing,
        availableDates: filterFutureTourDates(listing.availableDates ?? [], now),
      },
    ];
  });
}

export function summarizeOfferQualityDecisions(
  decisions: OfferQualityDecision[],
): Record<OfferPublishState, number> & { reasons: Record<string, number> } {
  const summary = {
    publishable: 0,
    degraded: 0,
    temporarily_unavailable: 0,
    quarantined: 0,
    rejected: 0,
    reasons: {} as Record<string, number>,
  };
  for (const decision of decisions) {
    summary[decision.state] += 1;
    for (const reason of decision.reasons) {
      summary.reasons[reason] = (summary.reasons[reason] ?? 0) + 1;
    }
  }
  return summary;
}

export function marketplaceTodayYmd(now?: Date): string {
  return todayYmdInTimeZone(now);
}
