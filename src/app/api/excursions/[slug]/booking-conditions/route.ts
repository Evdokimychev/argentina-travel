import { NextResponse } from "next/server";
import { parseExcursionSlug } from "@/lib/excursion-slug";
import { buildDefaultTickets } from "@/lib/excursion-schedule";
import { fetchExcursionDetailServer } from "@/lib/excursion-server";
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
      return NextResponse.json(
        buildExcursionBookingConditions({
          quote: null,
          instantBooking: excursion.instantBooking,
          isBookable: false,
        })
      );
    }

    try {
      const schedule = await fetchSputnik8ProductSchedule(excursion.id);
      const slot = schedule.dates[0]?.slots[0]
        ? { date: schedule.dates[0].date, time: schedule.dates[0].slots[0].time }
        : null;

      const conditions = buildExcursionBookingConditions({
        quote: slot
          ? {
              value: excursion.priceValue,
              currency: excursion.priceCurrency,
              value_string: excursion.priceDisplay,
            }
          : null,
        instantBooking: excursion.instantBooking,
        isBookable: excursion.isBookable,
      });

      return NextResponse.json(conditions);
    } catch (error) {
      if (error instanceof Sputnik8BookingError && (error.status === 401 || error.status === 403)) {
        return NextResponse.json(
          buildExcursionBookingConditions({
            quote: null,
            instantBooking: excursion.instantBooking,
            isBookable: false,
          })
        );
      }
      return NextResponse.json({ error: "Failed to load booking conditions." }, { status: 502 });
    }
  }

  if (!isTripsterConfigured()) {
    return NextResponse.json({ error: "Tripster is not configured." }, { status: 503 });
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
