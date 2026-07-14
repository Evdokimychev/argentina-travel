import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BOOKING_LOOKUP_COOKIE, hashLookupValue } from "@/lib/booking-lookup-security";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const token = (await cookies()).get(BOOKING_LOOKUP_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Access expired" }, { status: 401 });

  const admin = createSupabaseAdminClient();
  const { data: session } = await admin
    .from("booking_lookup_challenges")
    .select("id, booking_ids, session_expires_at")
    .eq("session_token_hash", hashLookupValue("session", token))
    .maybeSingle();
  if (!session?.session_expires_at || new Date(session.session_expires_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: "Access expired" }, { status: 401 });
  }

  const { data } = await admin
    .from("bookings")
    .select("id, tour_title, status, payment_status, guests, total_price_usd, start_date, end_date, created_at")
    .in("id", session.booking_ids)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    bookings: (data ?? []).map((booking) => ({
      id: booking.id,
      tourTitle: booking.tour_title,
      status: booking.status,
      paymentStatus: booking.payment_status,
      guests: booking.guests,
      totalPriceUsd: booking.total_price_usd,
      startDate: booking.start_date ?? undefined,
      endDate: booking.end_date ?? undefined,
    })),
    expiresAt: session.session_expires_at,
  });
}
