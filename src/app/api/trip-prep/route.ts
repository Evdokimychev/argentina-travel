import { NextResponse } from "next/server";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import { canAccessBooking, fetchBookingById } from "@/lib/bookings-server";
import { fetchTripPrepChecklist } from "@/lib/trip-prep-server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  if (!isSupabaseBookingsEnabled()) {
    return NextResponse.json({ error: "Trip prep API unavailable" }, { status: 503 });
  }

  const bookingId = new URL(request.url).searchParams.get("bookingId")?.trim();
  if (!bookingId) {
    return NextResponse.json({ error: "Укажите bookingId" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const sessionUser = await loadSessionUserFromSupabase(supabase);
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const booking = await fetchBookingById(supabase, bookingId);
  if (!booking) {
    return NextResponse.json({ error: "Бронирование не найдено" }, { status: 404 });
  }

  if (!canAccessBooking(booking, sessionUser, sessionUser.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const checklist = await fetchTripPrepChecklist(supabase, booking, sessionUser.id);
  if (!checklist) {
    return NextResponse.json({ error: "Шаблон чек-листа не найден" }, { status: 404 });
  }

  return NextResponse.json({ checklist });
}
