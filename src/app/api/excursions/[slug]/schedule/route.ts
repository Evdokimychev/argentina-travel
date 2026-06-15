import { NextResponse } from "next/server";
import { parseExcursionSlug } from "@/lib/excursion-slug";
import { parseExcursionSchedule } from "@/lib/excursion-schedule";
import { fetchExcursionDetailServer } from "@/lib/excursion-server";
import { fetchTripsterSchedule, TripsterBookingError } from "@/lib/tripster/booking-api";
import { isTripsterConfigured } from "@/lib/tripster/env";
import {
  fetchSputnik8ProductSchedule,
  Sputnik8BookingError,
} from "@/lib/sputnik8/booking-api";
import { isSputnik8Configured } from "@/lib/sputnik8/env";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const excursion = await fetchExcursionDetailServer(slug);
  if (!excursion) {
    return NextResponse.json({ error: "Excursion not found." }, { status: 404 });
  }

  const parsed = parseExcursionSlug(slug);

  if (parsed?.partner === "sputnik8" || excursion.partner === "sputnik8") {
    if (!isSputnik8Configured()) {
      return NextResponse.json({
        dates: [],
        affiliateFallback: `/api/affiliate/go/${slug}`,
      });
    }

    try {
      const schedule = await fetchSputnik8ProductSchedule(excursion.id);
      return NextResponse.json(schedule);
    } catch (error) {
      const status = error instanceof Sputnik8BookingError ? error.status : 502;
      if (status === 401 || status === 403 || status === 503) {
        return NextResponse.json({
          dates: [],
          affiliateFallback: `/api/affiliate/go/${slug}`,
        });
      }
      return NextResponse.json(
        { error: "Failed to load schedule." },
        { status: status >= 400 && status < 600 ? status : 502 }
      );
    }
  }

  if (!isTripsterConfigured()) {
    return NextResponse.json({ error: "Tripster is not configured." }, { status: 503 });
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
