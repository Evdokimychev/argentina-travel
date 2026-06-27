import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createTripsterAffiliateLink,
  isTravelpayoutsConfigured,
} from "@/lib/travelpayouts";
import { buildTripsterPartnerBookingUrl } from "@/lib/tripster/partner-tour-utils";
import {
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
  });

  if (!isTravelpayoutsConfigured()) {
    return bookingTarget;
  }

  try {
    const citySlug = supabase ? await resolveTripsterCitySlug(supabase, input.cityId) : undefined;
    const link = await createTripsterAffiliateLink({
      tripsterUrl: bookingTarget,
      experienceId: input.experienceId,
      citySlug,
    });

    const wrapped = link.partnerUrl?.trim() || link.url?.trim() || "";
    if (isUsableTripsterCheckoutUrl(wrapped)) {
      return wrapped;
    }
  } catch {
    // Fall back to direct Tripster checkout.
  }

  return bookingTarget;
}
