import { NextResponse } from "next/server";
import { fetchTripsterSchedule, TripsterBookingError } from "@/lib/tripster/booking-api";
import { mapScheduleToPartnerDates } from "@/lib/tripster/partner-tour-content";
import { fetchPartnerTourDetailServer } from "@/lib/tripster/partner-tour-server";
import { isTripsterConfigured } from "@/lib/tripster/env";
import { isPartnerTourDetail } from "@/lib/tripster/partner-tour-utils";
import { isYouTravelPartnerDetail } from "@/lib/youtravel/partner-tour-utils";
import { fetchYouTravelLiveOffers } from "@/lib/youtravel/offers-server";
import { fetchYouTravelTourDetailServer } from "@/lib/youtravel/partner-tour-server";
import { isYouTravelConfigured } from "@/lib/youtravel/env";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;

  const youtravelTour = await fetchYouTravelTourDetailServer(slug);
  if (youtravelTour && isYouTravelPartnerDetail(youtravelTour)) {
    const tourId = youtravelTour.partnerExperienceId;
    if (!tourId) {
      return NextResponse.json({ error: "Missing YouTravel tour id." }, { status: 400 });
    }

    const dates = await fetchYouTravelLiveOffers(tourId, youtravelTour);

    return NextResponse.json({
      dates,
      affiliateFallback: `/api/affiliate/go/${slug}`,
      configured: isYouTravelConfigured(),
    });
  }

  const tour = await fetchPartnerTourDetailServer(slug);

  if (!tour || !isPartnerTourDetail(tour) || isYouTravelPartnerDetail(tour)) {
    return NextResponse.json({ error: "Partner tour not found." }, { status: 404 });
  }

  if (!tour.partnerExperienceId) {
    return NextResponse.json({ error: "Missing Tripster experience id." }, { status: 400 });
  }

  if (!isTripsterConfigured()) {
    return NextResponse.json({
      dates: tour.dates,
      affiliateFallback: `/api/affiliate/go/${slug}`,
      configured: false,
    });
  }

  try {
    const schedule = await fetchTripsterSchedule(tour.partnerExperienceId);
    const scheduleDurationDays = tour.itinerary?.length || tour.durationDays;
    const dates = mapScheduleToPartnerDates(
      schedule,
      scheduleDurationDays,
      tour.partnerPriceCurrency
    );

    return NextResponse.json({
      dates: dates.length > 0 ? dates : tour.dates,
      maxPersons: schedule.defaults?.available_persons,
      configured: true,
    });
  } catch (error) {
    const status = error instanceof TripsterBookingError ? error.status : 502;
    if (status === 401 || status === 403 || status === 503) {
      return NextResponse.json({
        dates: tour.dates,
        affiliateFallback: `/api/affiliate/go/${slug}`,
        configured: false,
      });
    }

    return NextResponse.json(
      { error: "Failed to load schedule.", dates: tour.dates },
      { status: status >= 400 && status < 600 ? status : 502 }
    );
  }
}
