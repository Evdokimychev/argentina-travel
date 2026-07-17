import { NextResponse } from "next/server";
import {
  fetchTravelersFormBooking,
  saveTravelersFormBooking,
  TravelersFormError,
} from "@/lib/booking-travelers-server";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ token: string }> };

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Не удалось обработать данные участников";
  const status = error instanceof TravelersFormError ? error.status : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(_request: Request, context: RouteContext) {
  if (!isSupabaseBookingsEnabled()) {
    return NextResponse.json({ error: "Форма участников недоступна" }, { status: 503 });
  }
  try {
    const { token } = await context.params;
    const booking = await fetchTravelersFormBooking(createSupabaseAdminClient(), token);
    if (!booking) return NextResponse.json({ error: "Ссылка недействительна или заявка не найдена" }, { status: 404 });
    return NextResponse.json({ booking });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  if (!isSupabaseBookingsEnabled()) {
    return NextResponse.json({ error: "Форма участников недоступна" }, { status: 503 });
  }
  try {
    const { token } = await context.params;
    const body = (await request.json()) as { travelers?: unknown };
    const booking = await saveTravelersFormBooking({
      admin: createSupabaseAdminClient(),
      token,
      travelers: body.travelers,
    });
    if (!booking) return NextResponse.json({ error: "Ссылка недействительна или заявка не найдена" }, { status: 404 });
    return NextResponse.json({ booking });
  } catch (error) {
    return errorResponse(error);
  }
}
