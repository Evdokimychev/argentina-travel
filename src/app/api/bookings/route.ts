import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import { insertBooking } from "@/lib/bookings-server";
import { addBookingBreadcrumb, captureException } from "@/lib/monitoring/sentry";
import { getClientIp, withRateLimit } from "@/lib/rate-limit";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import type { Booking } from "@/types/tourist";
import { normalizeBooking } from "@/lib/bookings-store";

async function postBooking(request: Request) {
  if (!isSupabaseBookingsEnabled()) {
    return NextResponse.json({ error: "Bookings API unavailable" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as { booking?: Booking };
    if (!body.booking?.id || !body.booking.contactEmail) {
      return NextResponse.json({ error: "Invalid booking payload" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    let booking = normalizeBooking(body.booking);

    if (authUser) {
      booking = normalizeBooking({ ...booking, userId: authUser.id });
    }

    addBookingBreadcrumb("booking.create.requested", {
      bookingId: booking.id,
      userId: booking.userId,
      tourSlug: booking.tourSlug,
    });

    const result = await insertBooking(supabase, booking);
    if ("error" in result) {
      addBookingBreadcrumb("booking.create.failed", {
        bookingId: booking.id,
        error: result.error,
      });
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    addBookingBreadcrumb("booking.created", {
      bookingId: result.booking.id,
      userId: result.booking.userId,
      status: result.booking.status,
    });
    return NextResponse.json({ booking: result.booking });
  } catch (error) {
    addBookingBreadcrumb("booking.create.failed", {
      error: error instanceof Error ? error.message : "Unexpected error",
    });
    captureException(error, { tags: { area: "booking", action: "create" } });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(postBooking, {
  limit: 10,
  window: 60_000,
  keyPrefix: "bookings:create",
  key: (request) => `ip:${getClientIp(request)}`,
  message: "Слишком много попыток бронирования. Повторите позже.",
});

export async function GET() {
  if (!isSupabaseBookingsEnabled()) {
    return NextResponse.json({ error: "Bookings API unavailable" }, { status: 503 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = await loadSessionUserFromSupabase(supabase);
    if (!sessionUser) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { fetchUserBookings } = await import("@/lib/bookings-server");
    const byUserId = await fetchUserBookings(supabase, authUser.id);

    const { data: emailRows } = await supabase
      .from("bookings")
      .select("*")
      .is("user_id", null)
      .ilike("contact_email", sessionUser.email.trim().toLowerCase())
      .order("created_at", { ascending: false });

    const { rowsToBookings } = await import("@/lib/bookings-db-mapper");
    const byEmail = emailRows?.length
      ? rowsToBookings(emailRows).map((b) => normalizeBooking(b))
      : [];

    const merged = new Map<string, Booking>();
    for (const booking of [...byUserId, ...byEmail]) {
      merged.set(booking.id, booking);
    }

    return NextResponse.json({
      bookings: Array.from(merged.values()).sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      ),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
