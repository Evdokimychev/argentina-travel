import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createTripsterAffiliateLink,
  isTravelpayoutsConfigured,
} from "@/lib/travelpayouts";
import { buildTripsterPartnerBookingUrl } from "@/lib/tripster/partner-tour-utils";
import {
  buildTripsterExperiencePageUrl,
  isUsableTripsterCheckoutUrl,
  type TripsterCheckoutContext,
} from "@/lib/tripster/checkout-url";

export type TripsterAffiliateCheckoutInput = TripsterCheckoutContext & {
  experienceId: number;
  experienceSlug: string;
  cityId?: number | null;
  tripsterUrl?: string | null;
};

async function resolveTripsterCitySlug(
  supabase: SupabaseClient,
  cityId?: number | null
): Promise<string | undefined> {
  if (!cityId) return undefined;

  const { data } = await supabase
    .from("tripster_cities")
    .select("slug")
    .eq("id", cityId)
    .maybeSingle();

  return data?.slug ?? undefined;
}

/** Wraps any Tripster URL with Travelpayouts attribution when configured. */
export async function wrapTripsterUrlWithAffiliate(
  supabase: SupabaseClient | null,
  input: {
    experienceId: number;
    cityId?: number | null;
    tripsterUrl: string;
  }
): Promise<string> {
  const target = input.tripsterUrl.trim();
  if (!target || !isTravelpayoutsConfigured()) {
    return target;
  }

  try {
    const citySlug = supabase ? await resolveTripsterCitySlug(supabase, input.cityId) : undefined;
    const link = await createTripsterAffiliateLink({
      tripsterUrl: target,
      experienceId: input.experienceId,
      citySlug,
    });

    const wrapped = link.partnerUrl?.trim() || link.url?.trim() || "";
    if (isUsableTripsterCheckoutUrl(wrapped)) {
      return wrapped;
    }
  } catch {
    // Fall back to direct Tripster URL.
  }

  return target;
}

/** Builds prefilled Tripster checkout and optionally wraps it with Travelpayouts attribution. */
export async function resolveTripsterAffiliateCheckoutUrl(
  supabase: SupabaseClient | null,
  input: TripsterAffiliateCheckoutInput
): Promise<string> {
  const bookingTarget = buildTripsterPartnerBookingUrl(input.experienceId, {
    startDate: input.startDate,
    time: input.time,
    guests: input.guests,
    fallbackUrl: input.tripsterUrl,
    name: input.name,
    email: input.email,
    phone: input.phone,
    messageToGuide: input.messageToGuide,
  });

  return wrapTripsterUrlWithAffiliate(supabase, {
    experienceId: input.experienceId,
    cityId: input.cityId,
    tripsterUrl: bookingTarget,
  });
}

type TripsterAffiliateExperienceInput = {
  experienceId: number;
  experienceSlug: string;
  cityId?: number | null;
  tripsterUrl?: string | null;
};

/** Opens the public Tripster experience page with optional Travelpayouts attribution. */
export async function resolveTripsterAffiliateExperienceUrl(
  supabase: SupabaseClient | null,
  input: TripsterAffiliateExperienceInput
): Promise<string> {
  const pageTarget = buildTripsterExperiencePageUrl(input.experienceId, input.tripsterUrl);

  if (!isTravelpayoutsConfigured()) {
    return pageTarget;
  }

  try {
    const citySlug = supabase ? await resolveTripsterCitySlug(supabase, input.cityId) : undefined;
    const link = await createTripsterAffiliateLink({
      tripsterUrl: pageTarget,
      experienceId: input.experienceId,
      citySlug,
    });

    const wrapped = link.partnerUrl?.trim() || link.url?.trim() || "";
    if (isUsableTripsterCheckoutUrl(wrapped)) {
      return wrapped;
    }
  } catch {
    // Fall back to direct Tripster page.
  }

  return pageTarget;
}
