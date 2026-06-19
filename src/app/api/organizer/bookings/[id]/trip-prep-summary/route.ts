import { NextResponse } from "next/server";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import {
  fetchBookingById,
  organizerCanAccessBooking,
} from "@/lib/bookings-server";
import { fetchOrganizerTripPrepSummary } from "@/lib/trip-prep-server";
import { getOrganizerCatalogSlugs } from "@/lib/organizer-bookings";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { userHasAccountRole } from "@/types/user";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseBookingsEnabled()) {
    return NextResponse.json({ error: "Trip prep API unavailable" }, { status: 503 });
  }

  const { id: bookingId } = await context.params;
  const supabase = await createSupabaseServerClient();
  const sessionUser = await loadSessionUserFromSupabase(supabase);

  if (!sessionUser || !userHasAccountRole(sessionUser, "organizer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const booking = await fetchBookingById(supabase, bookingId);
  if (!booking) {
    return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
  }

  const slugs = getOrganizerCatalogSlugs(sessionUser.id);
  if (!organizerCanAccessBooking(booking, sessionUser.id, slugs)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const summary = await fetchOrganizerTripPrepSummary(supabase, booking);
  return NextResponse.json({ summary });
}
