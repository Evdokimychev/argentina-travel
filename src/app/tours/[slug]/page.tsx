import type { ReactNode } from "react";
import TourDetailView from "@/components/tour-detail/TourDetailView";
import TourJsonLd from "@/components/seo/TourJsonLd";
import FlightOffersJsonLd from "@/components/seo/FlightOffersJsonLd";
import TourFlightLogisticsSection from "@/components/flights/TourFlightLogisticsSection";
import { fetchTourDetail, fetchSimilarTours } from "@/lib/tours-server";
import {
  fetchCutoverCanonicalTourBySlug,
  fetchCutoverPublishedTourSlugs,
} from "@/lib/tours-server-cutover";
import { resolveTourFlightRouteIds } from "@/lib/flights/destination-airports";
import { getFlightPriceTeasers } from "@/lib/flights/hub-price-teasers";
import { getFlightTeaserLabels } from "@/lib/flights/teaser-labels";
import { absoluteUrl, resolvePublicUrl } from "@/lib/site-url";
import { resolveTourCoverImage } from "@/lib/tour-metadata";

export const dynamic = "force-dynamic";

interface TourPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ access?: string }>;
}

export const dynamicParams = true;

export async function generateStaticParams() {
  const platformSlugs = await fetchCutoverPublishedTourSlugs();

  const [tripsterSlugs, youtravelSlugs] = await Promise.all([
    import("@/lib/tripster/partner-tour-server").then((mod) =>
      mod.fetchPartnerTourSlugsServer().catch(() => [] as string[])
    ),
    import("@/lib/youtravel/partner-tour-server").then((mod) =>
      mod.fetchYouTravelTourSlugsServer().catch(() => [] as string[])
    ),
  ]);

  const merged = new Set([...platformSlugs, ...tripsterSlugs, ...youtravelSlugs]);
  return Array.from(merged).map((slug) => ({ slug }));
}

export async function generateMetadata({ params, searchParams }: TourPageProps) {
  const { slug } = await params;
  const { access } = await searchParams;
  const tour = await fetchTourDetail(slug, { accessToken: access });
  if (!tour) return { title: "Тур не найден" };
  const pageUrl = absoluteUrl(`/tours/${slug}`);
  const coverImage = resolveTourCoverImage(tour);
  const imageUrl = coverImage ? resolvePublicUrl(coverImage) : undefined;
  return {
    title: `${tour.title} — тур по Аргентине`,
    description: tour.shortDescription,
    robots: tour.isPrivate ? { index: false, follow: false } : undefined,
    openGraph: {
      title: tour.title,
      description: tour.shortDescription,
      url: pageUrl,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
      type: "website",
    },
    twitter: imageUrl
      ? {
          card: "summary_large_image",
          title: tour.title,
          description: tour.shortDescription,
          images: [imageUrl],
        }
      : undefined,
    alternates: tour.isPrivate
      ? undefined
      : {
          canonical: pageUrl,
        },
  };
}

export default async function TourDetailPage({ params, searchParams }: TourPageProps) {
  const { slug } = await params;
  const { access } = await searchParams;
  const tour = await fetchTourDetail(slug, { accessToken: access });
  const similarTours = tour ? await fetchSimilarTours(slug, 3) : [];
  const initialCanonicalTour = await fetchCutoverCanonicalTourBySlug(slug);

  const locale = "ru" as const;
  const labels = getFlightTeaserLabels(locale);
  let flightLogisticsSection: ReactNode | undefined;
  let flightOffersJsonLd: ReactNode = null;

  if (tour) {
    const routeIds = resolveTourFlightRouteIds(tour.title, tour.region);
    const flightTeasers = await getFlightPriceTeasers(routeIds, locale);

    if (flightTeasers.length > 0) {
      flightLogisticsSection = (
        <TourFlightLogisticsSection
          destination={tour.region}
          region={tour.region}
          locale={locale}
        />
      );
      flightOffersJsonLd = (
        <FlightOffersJsonLd teasers={flightTeasers} pageUrl={`/tours/${slug}`} />
      );
    }
  }

  return (
    <>
      {tour ? <TourJsonLd tour={tour} /> : null}
      {flightOffersJsonLd}
      <TourDetailView
        slug={slug}
        tour={tour}
        similarTours={similarTours}
        initialCanonicalTour={initialCanonicalTour}
        flightLogisticsSection={flightLogisticsSection}
        flightLogisticsNavLabel={flightLogisticsSection ? labels.tourTitle : undefined}
      />
    </>
  );
}
