import { NextResponse } from "next/server";
import { buildDefaultTickets } from "@/lib/excursion-schedule";
import {
  buildExcursionBookingConditions,
  pickFirstScheduleSlot,
} from "@/lib/tripster/booking-conditions";
import {
  fetchTripsterPriceQuote,
  fetchTripsterSchedule,
  TripsterBookingError,
} from "@/lib/tripster/booking-api";
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
    const closesBeforeMinutes = schedule.defaults?.closes_before;
    const slot = pickFirstScheduleSlot(schedule);

    let quote = null;
    if (slot) {
      const tickets = buildDefaultTickets(excursion.ticketOptions, 1);
      try {
        quote = await fetchTripsterPriceQuote(excursion.id, {
          personsCount: 1,
          date: slot.date,
          time: slot.time,
          tickets: tickets.length > 0 ? tickets : undefined,
        });
      } catch (error) {
        if (!(error instanceof TripsterBookingError)) {
          throw error;
        }
      }
    }

    const conditions = buildExcursionBookingConditions({
      quote,
      closesBeforeMinutes,
      instantBooking: excursion.instantBooking,
      isBookable: excursion.isBookable,
    });

    return NextResponse.json(conditions);
  } catch (error) {
    const status = error instanceof TripsterBookingError ? error.status : 502;
    return NextResponse.json(
      { error: "Failed to load booking conditions." },
      { status: status >= 400 && status < 600 ? status : 502 }
    );
  }
}
