import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type DbClient = SupabaseClient<Database>;

/**
 * Negative-capability guard: an authenticated organizer may only mutate
 * tours they own. Foreign tour IDs must not leak existence beyond 403/404.
 */
export async function assertOrganizerTourOwnership(
  admin: DbClient,
  tourId: string,
  organizerId: string,
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const { data: row, error } = await admin
    .from("tours")
    .select("id, owner_user_id")
    .eq("id", tourId)
    .maybeSingle();

  if (error) {
    return { ok: false, response: NextResponse.json({ error: error.message }, { status: 500 }) };
  }
  if (!row || row.owner_user_id !== organizerId) {
    return { ok: false, response: NextResponse.json({ error: "Предложение не найдено" }, { status: 404 }) };
  }

  return { ok: true };
}
