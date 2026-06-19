import { NextResponse } from "next/server";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import { canAccessBooking, fetchBookingById } from "@/lib/bookings-server";
import { resolveBookingPaymentStatus } from "@/lib/booking-params";
import { fetchLatestChargeReceiptForBooking } from "@/lib/payments/transaction-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseBookingsEnabled()) {
    return NextResponse.json({ error: "Bookings API unavailable" }, { status: 503 });
  }

  const { id } = await context.params;

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const booking = await fetchBookingById(supabase, id);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (!canAccessBooking(booking, sessionUser, sessionUser.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const paymentStatus = resolveBookingPaymentStatus(booking);
    if (paymentStatus !== "paid" && paymentStatus !== "partial" && paymentStatus !== "refunded") {
      return NextResponse.json({ receipt: null, paymentStatus });
    }

    const admin = createSupabaseAdminClient();
    const receipt = await fetchLatestChargeReceiptForBooking(admin, booking.id);
    return NextResponse.json({ receipt, paymentStatus });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected error while loading payment receipt",
      },
      { status: 500 }
    );
  }
}
