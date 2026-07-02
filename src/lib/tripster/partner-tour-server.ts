import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isTripsterConfigured, fetchTripsterExperience, fetchTripsterTourPlan, fetchTripsterWebExperience } from "@/lib/tripster/client";
import { fetchTripsterSchedule } from "@/lib/tripster/booking-api";
import { buildPartnerContent, mapScheduleToPartnerDates, mapTripsterPlanToItinerary, buildPartnerImportantInfo } from "@/lib/tripster/partner-tour-content";
import {
  finalizePartnerLodging,
  mapPartnerAccommodations,
} from "@/lib/tripster/partner-tour-accommodation";
import {
  resolvePartnerTourReviews,
  resolvePartnerGuideReviews,
  syncPartnerTourReviewCount,
} from "@/lib/tripster/partner-tour-reviews";
import {
  applyTripsterGuideToOrganizer,
  fetchGuideExperienceCountServer,
  fetchPartnerTourGuideProfileServer,
} from "@/lib/tripster/partner-tour-guide-server";
import {
  fetchPartnerTourDetail,
  fetchPartnerTourListings,
  fetchPartnerTourSlugs,
} from "@/lib/tripster/partner-tour-repository";
import { resolvePartnerTourDuration, resolvePartnerTourScheduleDurationDays } from "@/lib/tripster/partner-tour-mapper";
import { resolvePartnerTourBookingMode } from "@/lib/tripster/partner-tour-booking";
import { enrichTripsterListingsWithSchedule } from "@/lib/tripster/partner-tour-listing-schedule";
import { rankSimilarListings } from "@/lib/tour-recommendations";
import type { TourDetail, TourListing } from "@/types";
import type { TripsterExperience } from "@/lib/tripster/types";

function getClient() {
  try {
    return createSupabaseAdminClient();
  } catch {
    return null;
  }
}

async function enrichPartnerTourDetail(tour: TourDetail): Promise<TourDetail> {
  if (!tour.partnerExperienceId || !isTripsterConfigured()) return tour;

  let enriched = tour;
  let liveExperience: Awaited<ReturnType<typeof fetchTripsterExperience>> | null = null;

  try {
    liveExperience = await fetchTripsterExperience(tour.partnerExperienceId, {
      detailed: true,
      priceFormat: "detailed",
    });

    if (liveExperience.id !== tour.partnerExperienceId) {
      throw new Error("Tripster experience id mismatch");
    }

    try {
      const webExperience = await fetchTripsterWebExperience(tour.partnerExperienceId);
      if (webExperience.id !== tour.partnerExperienceId) {
        throw new Error("Tripster web experience id mismatch");
      }
      liveExperience = {
        ...liveExperience,
        additional_info: webExperience.additional_info ?? liveExperience.additional_info,
        comfort_level_info:
          webExperience.comfort_level_info?.trim() || liveExperience.comfort_level_info,
        accommodation: webExperience.accommodation ?? liveExperience.accommodation,
        languages: webExperience.languages ?? liveExperience.languages,
      };
    } catch {
      // web v2 optional
    }

    enriched = {
      ...enriched,
      partnerContent: buildPartnerContent(liveExperience),
    };
  } catch {
    // keep content from DB payload
  }

  let scheduleDurationDays = enriched.itinerary?.length ?? enriched.durationDays;

  try {
    const plan = await fetchTripsterTourPlan(tour.partnerExperienceId);
    if (plan.length) {
      const duration = resolvePartnerTourDuration(
        liveExperience ?? ({ id: tour.partnerExperienceId, type: "tour" } satisfies TripsterExperience),
        undefined,
        { program: plan }
      );
      scheduleDurationDays = resolvePartnerTourScheduleDurationDays(
        liveExperience ?? ({ id: tour.partnerExperienceId, type: "tour" } satisfies TripsterExperience),
        undefined,
        { program: plan, itineraryDayCount: plan.length }
      );
      enriched = {
        ...enriched,
        durationDays: duration.durationDays,
        durationNights: duration.durationNights,
        itinerary: enriched.itinerary?.length
          ? enriched.itinerary
          : mapTripsterPlanToItinerary(plan),
      };
    }
  } catch {
    // program optional
  }

  let scheduleDatesCount = 0;

  try {
    const schedule = await fetchTripsterSchedule(tour.partnerExperienceId);
    const dates = mapScheduleToPartnerDates(
      schedule,
      scheduleDurationDays,
      enriched.partnerPriceCurrency,
      enriched.groupMax,
    );
    scheduleDatesCount = dates.length;
    if (dates.length) {
      enriched = {
        ...enriched,
        dates,
        bookingMode: resolvePartnerTourBookingMode(liveExperience ?? undefined, dates.length),
      };
    }
  } catch {
    // schedule optional
  }

  if (scheduleDatesCount === 0) {
    enriched = {
      ...enriched,
      bookingMode: resolvePartnerTourBookingMode(liveExperience ?? undefined, enriched.dates.length),
    };
  }

  try {
    const reviews = await resolvePartnerTourReviews(enriched, tour.partnerExperienceId);
    if (reviews.length) {
      enriched = { ...enriched, ...syncPartnerTourReviewCount(enriched, reviews) };
    }
  } catch {
    // reviews optional
  }

  const guideId = Number.parseInt(enriched.organizer.id, 10);
  if (Number.isFinite(guideId) && guideId > 0) {
    try {
      const experienceCount = await fetchGuideExperienceCountServer(guideId);
      const guideData = await fetchPartnerTourGuideProfileServer(guideId);

      if (guideData) {
        const { profile, experienceCount: profileCount } = guideData;
        enriched = {
          ...enriched,
          partnerGuideProfile: profile,
          organizer: applyTripsterGuideToOrganizer(
            enriched.organizer,
            profile,
            Math.max(experienceCount, profileCount)
          ),
          organizerComment: profile.description?.trim()
            ? { greeting: "", recommendations: [], routeNotes: "" }
            : enriched.organizerComment,
        };
      } else if (experienceCount > 0) {
        enriched = {
          ...enriched,
          organizer: {
            ...enriched.organizer,
            tourCount: Math.max(experienceCount, enriched.organizer.tourCount),
          },
        };
      }
    } catch {
      // guide profile optional
    }

    if (enriched.reviews.length === 0) {
      try {
        const guideReviews = await resolvePartnerGuideReviews(guideId, {
          excludeExperienceId: tour.partnerExperienceId,
          limit: 50,
        });
        if (guideReviews.length > 0) {
          enriched = { ...enriched, partnerGuideReviews: guideReviews };
        }
      } catch {
        // guide reviews optional
      }
    }
  }

  if (enriched.partnerContent) {
    const experienceForLodging: TripsterExperience =
      liveExperience ??
      ({
        id: tour.partnerExperienceId ?? 0,
        price_included_description: enriched.partnerContent.includedHtml,
        price_not_included_description: enriched.partnerContent.excludedHtml,
        annotation: enriched.shortDescription,
      } satisfies TripsterExperience);
    const partnerContent = finalizePartnerLodging(
      enriched.partnerContent,
      experienceForLodging,
      enriched.itinerary ?? []
    );
    enriched = {
      ...enriched,
      partnerContent,
      accommodations: mapPartnerAccommodations(partnerContent),
      importantInfo: buildPartnerImportantInfo(partnerContent),
    };
  }

  return enriched;
}

async function loadPartnerTourListings(): Promise<TourListing[]> {
  const supabase = getClient();
  let fromSupabase: TourListing[] = [];

  if (supabase) {
    try {
      fromSupabase = await fetchPartnerTourListings(supabase);
    } catch {
      fromSupabase = [];
    }
  }

  if (fromSupabase.length > 0) return fromSupabase;

  try {
    const { pgFetchPartnerTourListings } = await import("@/lib/tripster/partner-tour-pg-repository");
    return await pgFetchPartnerTourListings();
  } catch {
    return [];
  }
}

const cachedPartnerTourListings = unstable_cache(
  async () => enrichTripsterListingsWithSchedule(await loadPartnerTourListings()),
  ["partner-tour-listings", "pg-fallback-v2"],
  { revalidate: 600, tags: ["partner-tours"] },
);

export async function fetchPartnerTourListingsServer(): Promise<TourListing[]> {
  return cachedPartnerTourListings();
}

async function loadPartnerTourDetail(slug: string): Promise<TourDetail | null> {
  const supabase = getClient();
  let tour: TourDetail | null = null;

  if (supabase) {
    tour = await fetchPartnerTourDetail(supabase, slug);
  }

  if (!tour) {
    const { pgFetchPartnerTourDetail } = await import(
      "@/lib/tripster/partner-tour-pg-repository"
    );
    tour = await pgFetchPartnerTourDetail(slug);
  }

  if (!tour) return null;
  return enrichPartnerTourDetail(tour);
}

/**
 * Cross-request, time-based cache (10 min) for the partner-tour detail. The
 * enrichment cascade hits the live Tripster API (experience, web v2, plan,
 * schedule, reviews, guide) and the catalog only changes on the nightly sync,
 * so serving a slightly stale snapshot is the right trade-off — live price and
 * availability are still fetched per-request by the booking/price route. The
 * resolved `TourDetail` is plain JSON, and the cascade reads only env + the
 * partner API (no cookies/headers), so it is safe inside `unstable_cache`.
 */
const cachedPartnerTourDetail = unstable_cache(
  loadPartnerTourDetail,
  ["partner-tour-detail"],
  { revalidate: 600, tags: ["partner-tours"] }
);

/**
 * Request-scoped memoization on top of the time-based cache: `generateMetadata`
 * and the page body resolve the same slug within one render, and similar-tour
 * ranking can revisit it — `cache()` collapses those into a single lookup.
 */
export const fetchPartnerTourDetailServer = cache(
  (slug: string): Promise<TourDetail | null> => cachedPartnerTourDetail(slug)
);

export async function fetchPartnerTourSlugsServer(): Promise<string[]> {
  const supabase = getClient();
  if (supabase) {
    const slugs = await fetchPartnerTourSlugs(supabase);
    if (slugs.length > 0) return slugs;
  }

  const { pgFetchPartnerTourSlugs } = await import("@/lib/tripster/partner-tour-pg-repository");
  return pgFetchPartnerTourSlugs();
}

export async function fetchSimilarPartnerToursServer(
  slug: string,
  limit = 3,
  listings?: TourListing[]
): Promise<TourDetail[]> {
  const allListings = listings ?? (await fetchPartnerTourListingsServer());
  const base = allListings.find((item) => item.slug === slug);
  if (!base) return [];

  const ranked = rankSimilarListings(base, allListings, limit);
  const details: TourDetail[] = [];

  for (const item of ranked) {
    const detail = await fetchPartnerTourDetailServer(item.slug);
    if (detail) details.push(detail);
  }

  return details;
}
