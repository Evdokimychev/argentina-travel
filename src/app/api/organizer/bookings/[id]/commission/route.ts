import { NextResponse } from "next/server";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import { fetchBookingById, organizerCanAccessBooking } from "@/lib/bookings-server";
import {
  getCommissionRuleForBooking,
  listCommissionSnapshotsForBooking,
} from "@/lib/payments/commission-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { userHasAccountRole } from "@/types/user";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseBookingsEnabled()) {
    return NextResponse.json({ error: "Bookings API unavailable" }, { status: 503 });
  }

  const { id: bookingId } = await context.params;

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);

    if (!sessionUser || !userHasAccountRole(sessionUser, "organizer")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const booking = await fetchBookingById(supabase, bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (!organizerCanAccessBooking(booking, sessionUser.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [snapshots, rule] = await Promise.all([
      listCommissionSnapshotsForBooking(supabase, bookingId),
      getCommissionRuleForBooking(supabase, bookingId),
    ]);

    return NextResponse.json({ snapshots, rule });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected error while loading commission data",
      },
      { status: 500 }
    );
  }
}
