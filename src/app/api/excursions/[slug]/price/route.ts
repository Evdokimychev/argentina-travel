import { NextResponse } from "next/server";
import { buildDefaultTickets } from "@/lib/excursion-schedule";
import { fetchTripsterPriceQuote, TripsterBookingError } from "@/lib/tripster/booking-api";
import { isTripsterConfigured } from "@/lib/tripster/env";
import { fetchExcursionDetailServer } from "@/lib/tripster/excursion-server";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: Request, context: RouteContext) {
  if (!isTripsterConfigured()) {
    return NextResponse.json({ error: "Tripster is not configured." }, { status: 503 });
  }

  const { slug } = await context.params;
  const excursion = await fetchExcursionDetailServer(slug);
  if (!excursion) {
    return NextResponse.json({ error: "Excursion not found." }, { status: 404 });
  }

  const url = new URL(request.url);
  const date = url.searchParams.get("date")?.trim();
  const time = url.searchParams.get("time")?.trim();
  const personsCount = Number.parseInt(url.searchParams.get("persons") ?? "1", 10);

  if (!date || !time || !Number.isFinite(personsCount) || personsCount < 1) {
    return NextResponse.json({ error: "Invalid query parameters." }, { status: 400 });
  }

  const tickets = buildDefaultTickets(excursion.ticketOptions, personsCount);

  try {
    const quote = await fetchTripsterPriceQuote(excursion.id, {
      personsCount,
      date,
      time,
      tickets: tickets.length > 0 ? tickets : undefined,
    });
    return NextResponse.json({ quote });
  } catch (error) {
    const status = error instanceof TripsterBookingError ? error.status : 502;
    return NextResponse.json(
      { error: "Failed to calculate price." },
      { status: status >= 400 && status < 600 ? status : 502 }
    );
  }
}
