import { NextResponse } from "next/server";
import { parseExcursionSchedule } from "@/lib/excursion-schedule";
import { fetchTripsterSchedule, TripsterBookingError } from "@/lib/tripster/booking-api";
import { isTripsterConfigured } from "@/lib/tripster/env";
import { fetchExcursionDetailServer } from "@/lib/tripster/excursion-server";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  if (!isTripsterConfigured()) {
    return NextResponse.json({ error: "Tripster is not configured." }, { status: 503 });
  }

  const { slug } = await context.params;
  const excursion = await fetchExcursionDetailServer(slug);
  if (!excursion) {
    return NextResponse.json({ error: "Excursion not found." }, { status: 404 });
  }

  try {
    const schedule = await fetchTripsterSchedule(excursion.id);
    return NextResponse.json(parseExcursionSchedule(schedule));
  } catch (error) {
    const status = error instanceof TripsterBookingError ? error.status : 502;
    return NextResponse.json(
      { error: "Failed to load schedule." },
      { status: status >= 400 && status < 600 ? status : 502 }
    );
  }
}
