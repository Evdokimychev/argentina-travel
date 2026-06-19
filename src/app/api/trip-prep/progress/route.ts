import { NextResponse } from "next/server";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import { canAccessBooking, fetchBookingById } from "@/lib/bookings-server";
import {
  fetchTripPrepChecklist,
  fetchTripPrepTemplateForBooking,
  toggleTripPrepProgress,
} from "@/lib/trip-prep-server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PatchBody = {
  bookingId?: string;
  itemId?: string;
  checked?: boolean;
};

export async function PATCH(request: Request) {
  if (!isSupabaseBookingsEnabled()) {
    return NextResponse.json({ error: "Trip prep API unavailable" }, { status: 503 });
  }

  const body = (await request.json()) as PatchBody;
  const bookingId = body.bookingId?.trim();
  const itemId = body.itemId?.trim();

  if (!bookingId || !itemId || typeof body.checked !== "boolean") {
    return NextResponse.json(
      { error: "Укажите bookingId, itemId и checked" },
      { status: 400 }
    );
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

  const resolved = await fetchTripPrepTemplateForBooking(supabase, booking);
  const itemBelongsToTemplate = resolved?.items.some((item) => item.id === itemId);
  if (!itemBelongsToTemplate) {
    return NextResponse.json({ error: "Пункт чек-листа не найден" }, { status: 404 });
  }

  const ok = await toggleTripPrepProgress(supabase, {
    bookingId,
    userId: sessionUser.id,
    itemId,
    checked: body.checked,
  });

  if (!ok) {
    return NextResponse.json({ error: "Не удалось сохранить прогресс" }, { status: 500 });
  }

  const checklist = await fetchTripPrepChecklist(supabase, booking, sessionUser.id);
  if (!checklist) {
    return NextResponse.json({ error: "Шаблон чек-листа не найден" }, { status: 404 });
  }

  return NextResponse.json({ checklist });
}
