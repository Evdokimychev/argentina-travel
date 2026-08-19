import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type DbClient = SupabaseClient<Database>;

/**
 * Server-only catalog slugs the organizer actually owns in `tours`.
 * Seed/local listings must not authorize booking, review, or inbox access.
 */
export async function getOrganizerOwnedCatalogSlugs(
  supabase: DbClient,
  organizerUserId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("tours")
    .select("slug")
    .eq("owner_user_id", organizerUserId);

  if (error || !data?.length) return [];

  const slugs = new Set<string>();
  for (const row of data) {
    if (typeof row.slug === "string" && row.slug.trim()) {
      slugs.add(row.slug);
    }
  }
  return [...slugs];
}
