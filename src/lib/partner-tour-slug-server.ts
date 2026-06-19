import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { isTripsterTourExperience } from "@/lib/tripster/partner-tour-utils";

type DbClient = SupabaseClient<Database>;

/** Server-side check: slug belongs to a Tripster partner tour (not platform-native). */
export async function isPartnerTourSlugServer(
  supabase: DbClient,
  tourSlug: string
): Promise<boolean> {
  const normalized = tourSlug.trim();
  if (!normalized) return false;

  const { data } = await supabase
    .from("tripster_experiences")
    .select("id, experience_type, payload")
    .eq("slug", normalized)
    .maybeSingle();

  if (!data) return false;
  return isTripsterTourExperience(data);
}

export function isPartnerTourId(tourId: string): boolean {
  return tourId.trim().startsWith("tripster-");
}
