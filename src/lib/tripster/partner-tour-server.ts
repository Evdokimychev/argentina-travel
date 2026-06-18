import "server-only";

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
import { resolvePartnerTourDuration } from "@/lib/tripster/partner-tour-mapper";
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

  let resolvedDurationDays = enriched.durationDays;

  try {
    const plan = await fetchTripsterTourPlan(tour.partnerExperienceId);
    if (plan.length) {
      const duration = resolvePartnerTourDuration(
        liveExperience ?? ({ id: tour.partnerExperienceId, type: "tour" } satisfies TripsterExperience),
        undefined,
        { program: plan }
      );
      resolvedDurationDays = duration.durationDays;
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

  try {
    const schedule = await fetchTripsterSchedule(tour.partnerExperienceId);
    const dates = mapScheduleToPartnerDates(
      schedule,
      resolvedDurationDays,
      tour.partnerPriceCurrency
    );
    if (dates.length) {
      enriched = { ...enriched, dates, bookingMode: "scheduled" };
    }
  } catch {
    // schedule optional
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

export async function fetchPartnerTourListingsServer(): Promise<TourListing[]> {
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

export async function fetchPartnerTourDetailServer(slug: string): Promise<TourDetail | null> {
  const supabase = getClient();
  let tour: TourDetail | null = null;

  if (supabase) {
    tour = await fetchPartnerTourDetail(supabase, slug);
  }

  if (!tour) {
    const { pgFetchPartnerTourDetail } = await import("@/lib/tripster/partner-tour-pg-repository");
    tour = await pgFetchPartnerTourDetail(slug);
  }

  if (!tour) return null;
  return enrichPartnerTourDetail(tour);
}

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
