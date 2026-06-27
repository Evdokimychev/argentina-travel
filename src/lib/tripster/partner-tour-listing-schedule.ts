import "server-only";

import { fetchTripsterSchedule } from "@/lib/tripster/booking-api";
import { mapScheduleToAvailableDates } from "@/lib/tripster/partner-tour-content";
import { isTripsterConfigured } from "@/lib/tripster/client";
import {
  resolvePartnerTourScheduleDurationDays,
  type PartnerTourExperienceRow,
} from "@/lib/tripster/partner-tour-mapper";
import { parsePartnerTourListingExperienceId } from "@/lib/tripster/partner-tour-utils";
import type { TripsterExperience, TripsterScheduleResponse } from "@/lib/tripster/types";
import type { TourDate, TourListing } from "@/types";

const SCHEDULE_FETCH_CONCURRENCY = 5;

export type TripsterExperienceWithSchedule = TripsterExperience & {
  schedule_snapshot?: TripsterScheduleResponse | null;
};

export function resolveTripsterCatalogAvailableDates(
  row: PartnerTourExperienceRow,
  experience: TripsterExperienceWithSchedule,
): TourDate[] {
  const schedule = experience.schedule_snapshot;
  if (!schedule?.schedule || Object.keys(schedule.schedule).length === 0) {
    return [];
  }

  const durationDays = resolvePartnerTourScheduleDurationDays(
    experience,
    row.duration_minutes,
    {
      experienceType: row.experience_type,
      itineraryDayCount: experience.plan_days_count,
    },
  );

  return mapScheduleToAvailableDates(schedule, durationDays);
}

async function fetchListingAvailableDates(
  listing: TourListing,
): Promise<TourListing["availableDates"]> {
  if (listing.availableDates.length > 0) return listing.availableDates;

  const experienceId = parsePartnerTourListingExperienceId(listing.id);
  if (!experienceId) return listing.availableDates;

  try {
    const schedule = await fetchTripsterSchedule(experienceId);
    return mapScheduleToAvailableDates(schedule, listing.durationDays);
  } catch {
    return listing.availableDates;
  }
}

export async function enrichTripsterListingsWithSchedule(
  listings: TourListing[],
): Promise<TourListing[]> {
  if (!isTripsterConfigured() || listings.length === 0) {
    return listings;
  }

  const enriched = [...listings];

  for (let offset = 0; offset < listings.length; offset += SCHEDULE_FETCH_CONCURRENCY) {
    const batch = listings.slice(offset, offset + SCHEDULE_FETCH_CONCURRENCY);
    const batchDates = await Promise.all(batch.map((listing) => fetchListingAvailableDates(listing)));

    batchDates.forEach((availableDates, index) => {
      if (availableDates.length === 0) return;
      enriched[offset + index] = {
        ...batch[offset + index]!,
        availableDates,
      };
    });
  }

  return enriched;
}
