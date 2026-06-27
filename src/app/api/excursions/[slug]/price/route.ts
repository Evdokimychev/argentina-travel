import { NextResponse } from "next/server";
import { parseExcursionSlug } from "@/lib/excursion-slug";
import { buildDefaultTickets } from "@/lib/excursion-schedule";
import { resolveExcursionBookingPrice } from "@/lib/excursion-price-display";
import { fetchExcursionDetailServer } from "@/lib/excursion-server";
import { fetchTripsterPriceQuote, TripsterBookingError } from "@/lib/tripster/booking-api";
import { isTripsterConfigured } from "@/lib/tripster/env";
import {
  fetchSputnik8Events,
  Sputnik8ApiError,
} from "@/lib/sputnik8/client";
import { isSputnik8Configured } from "@/lib/sputnik8/env";

type RouteContext = { params: Promise<{ slug: string }> };

function buildEstimateQuote(
  excursion: NonNullable<Awaited<ReturnType<typeof fetchExcursionDetailServer>>>,
  personsCount: number,
  slotPriceValue?: number
) {
  const estimate = resolveExcursionBookingPrice({
    excursion,
    persons: personsCount,
    quoteMatchesRequest: false,
    hasDateAndTime: true,
    slotPriceValue,
  });

  if (!estimate) {
    return { quote: null, estimate: true as const };
  }

  return {
    quote: {
      value: estimate.totalValue > 0 ? estimate.totalValue : undefined,
      currency: estimate.currency,
      value_string: estimate.displayFallback,
    },
    estimate: true as const,
  };
}

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const excursion = await fetchExcursionDetailServer(slug);
  if (!excursion) {
    return NextResponse.json({ error: "Excursion not found." }, { status: 404 });
  }

  const url = new URL(request.url);
  const date = url.searchParams.get("date")?.trim();
  const time = url.searchParams.get("time")?.trim();
  const personsCount = Number.parseInt(url.searchParams.get("persons") ?? "1", 10);

  if (!Number.isFinite(personsCount) || personsCount < 1) {
    return NextResponse.json({ error: "Invalid query parameters." }, { status: 400 });
  }

  if (!date || !time) {
    return NextResponse.json(buildEstimateQuote(excursion, personsCount));
  }

  const parsed = parseExcursionSlug(slug);

  if (parsed?.partner === "sputnik8" || excursion.partner === "sputnik8") {
    if (!isSputnik8Configured()) {
      return NextResponse.json({
        quote: null,
        affiliateFallback: `/api/affiliate/go/${slug}`,
      });
    }

    try {
      const events = await fetchSputnik8Events(excursion.id);
      const event = events.find((item) => {
        const eventDate = item.date ?? item.datetime?.slice(0, 10) ?? item.starts_at?.slice(0, 10);
        const eventTime = item.time ?? item.datetime?.slice(11, 16) ?? item.starts_at?.slice(11, 16);
        return eventDate === date && eventTime?.startsWith(time.slice(0, 5));
      });

      const basePrice = excursion.priceValue ?? 0;
      const total = basePrice * personsCount;
      return NextResponse.json({
        quote: {
          value: total || undefined,
          currency: excursion.priceCurrency,
          value_string: excursion.priceDisplay,
          event_id: event?.id,
        },
        estimate: false,
      });
    } catch (error) {
      const status = error instanceof Sputnik8ApiError ? error.status : 502;
      if (status === 401 || status === 403 || status === 503) {
        return NextResponse.json({
          quote: null,
          affiliateFallback: `/api/affiliate/go/${slug}`,
        });
      }
      return NextResponse.json(
        { error: "Failed to calculate price." },
        { status: status >= 400 && status < 600 ? status : 502 }
      );
    }
  }

  if (!isTripsterConfigured()) {
    return NextResponse.json(buildEstimateQuote(excursion, personsCount));
  }

  const tickets = buildDefaultTickets(excursion.ticketOptions, personsCount);

  try {
    const quote = await fetchTripsterPriceQuote(excursion.id, {
      personsCount,
      date,
      time,
      tickets: tickets.length > 0 ? tickets : undefined,
    });
    return NextResponse.json({ quote, estimate: false });
  } catch (error) {
    const status = error instanceof TripsterBookingError ? error.status : 502;
    if (status === 404 || status === 422) {
      return NextResponse.json(buildEstimateQuote(excursion, personsCount));
    }
    return NextResponse.json(
      { error: "Failed to calculate price." },
      { status: status >= 400 && status < 600 ? status : 502 }
    );
  }
}
