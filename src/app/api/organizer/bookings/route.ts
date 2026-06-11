import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import { fetchOrganizerBookings } from "@/lib/bookings-server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { getOrganizerCatalogSlugs } from "@/lib/organizer-bookings";
import { userHasAccountRole } from "@/types/user";

export async function GET() {
  if (!isSupabaseBookingsEnabled()) {
    return NextResponse.json({ error: "Bookings API unavailable" }, { status: 503 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);

    if (!sessionUser || !userHasAccountRole(sessionUser, "organizer")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const slugs = getOrganizerCatalogSlugs(sessionUser.id);
    const bookings = await fetchOrganizerBookings(supabase, sessionUser.id, slugs);

    return NextResponse.json({ bookings });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
