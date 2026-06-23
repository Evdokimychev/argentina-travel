import { NextResponse } from "next/server";
import { fetchYouTravelLiveOffers } from "@/lib/youtravel/offers-server";
import { fetchYouTravelTourDetailServer } from "@/lib/youtravel/partner-tour-server";
import { isYouTravelPartnerDetail } from "@/lib/youtravel/partner-tour-utils";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const tour = await fetchYouTravelTourDetailServer(slug);

  if (!tour || !isYouTravelPartnerDetail(tour) || !tour.partnerExperienceId) {
    return NextResponse.json({ error: "YouTravel tour not found." }, { status: 404 });
  }

  const offers = await fetchYouTravelLiveOffers(tour.partnerExperienceId, tour);

  return NextResponse.json({
    tourId: tour.partnerExperienceId,
    slug: tour.slug,
    offers,
    affiliateFallback: `/api/affiliate/go/${slug}`,
  });
}
