import { NextResponse } from "next/server";
import { fetchPartnerTourDetailServer } from "@/lib/tripster/partner-tour-server";
import { fetchTripsterPriceQuote, TripsterBookingError } from "@/lib/tripster/booking-api";
import { isTripsterConfigured } from "@/lib/tripster/env";
import { resolvePartnerTourBookingPrice } from "@/lib/tripster/partner-tour-price";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const tour = await fetchPartnerTourDetailServer(slug);

  if (!tour || tour.partnerSource !== "tripster" || !tour.partnerExperienceId) {
    return NextResponse.json({ error: "Partner tour not found." }, { status: 404 });
  }

  const url = new URL(request.url);
  const date = url.searchParams.get("date")?.trim();
  const time = url.searchParams.get("time")?.trim();
  const personsCount = Number.parseInt(url.searchParams.get("persons") ?? "1", 10);

  if (!Number.isFinite(personsCount) || personsCount < 1) {
    return NextResponse.json({ error: "Invalid query parameters." }, { status: 400 });
  }

  if (!date || !time) {
    const estimate = resolvePartnerTourBookingPrice({
      tour,
      guests: personsCount,
    });

    if (!estimate) {
      return NextResponse.json({ quote: null, estimate: true });
    }

    return NextResponse.json({
      quote: {
        value: estimate.totalValue > 0 ? estimate.totalValue : undefined,
        currency: estimate.currency,
        value_string: estimate.displayFallback,
      },
      estimate: true,
    });
  }

  if (!isTripsterConfigured()) {
    const estimate = resolvePartnerTourBookingPrice({
      tour,
      guests: personsCount,
      selectedDate: tour.dates.find(
        (item) => item.id === `tripster-${date}-${time}`
      ),
    });
    return NextResponse.json({
      quote: estimate
        ? {
            value: estimate.totalValue > 0 ? estimate.totalValue : undefined,
            currency: estimate.currency,
            value_string: estimate.displayFallback,
          }
        : null,
      estimate: true,
    });
  }

  try {
    const quote = await fetchTripsterPriceQuote(tour.partnerExperienceId, {
      personsCount,
      date,
      time,
    });
    return NextResponse.json({ quote, estimate: false });
  } catch (error) {
    const status = error instanceof TripsterBookingError ? error.status : 502;
    if (status === 404 || status === 422) {
      const estimate = resolvePartnerTourBookingPrice({
        tour,
        guests: personsCount,
        selectedDate: tour.dates.find(
          (item) => item.id === `tripster-${date}-${time}`
        ),
      });
      return NextResponse.json({
        quote: estimate
          ? {
              value: estimate.totalValue > 0 ? estimate.totalValue : undefined,
              currency: estimate.currency,
              value_string: estimate.displayFallback,
            }
          : null,
        estimate: true,
      });
    }
    return NextResponse.json(
      { error: "Failed to calculate price." },
      { status: status >= 400 && status < 600 ? status : 502 }
    );
  }
}
