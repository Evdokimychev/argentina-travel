import type { ReactNode } from "react";
import TourDetailView from "@/components/tour-detail/TourDetailView";
import TourJsonLd from "@/components/seo/TourJsonLd";
import FlightOffersJsonLd from "@/components/seo/FlightOffersJsonLd";
import TourFlightLogisticsSection from "@/components/flights/TourFlightLogisticsSection";
import { fetchTourDetail, fetchSimilarTours } from "@/lib/tours-server";
import { getCanonicalTourBySlug } from "@/lib/tour-repository";
import { isSupabaseToursEnabled } from "@/lib/auth-mode";
import { baseTours } from "@/data/tours";
import { resolveTourFlightRouteIds } from "@/lib/flights/destination-airports";
import { getFlightPriceTeasers } from "@/lib/flights/hub-price-teasers";
import { getFlightTeaserLabels } from "@/lib/flights/teaser-labels";

interface TourPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ access?: string }>;
}

export const dynamicParams = true;

export async function generateStaticParams() {
  const staticSlugs = baseTours.map((tour) => tour.slug);

  if (isSupabaseToursEnabled()) {
    try {
      const { fetchPublishedSlugsServer } = await import("@/lib/tour-content-server");
      const dbSlugs = await fetchPublishedSlugsServer();
      const merged = new Set([...staticSlugs, ...dbSlugs]);
      return Array.from(merged).map((slug) => ({ slug }));
    } catch {
      // use static slugs only
    }
  }

  return staticSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params, searchParams }: TourPageProps) {
  const { slug } = await params;
  const { access } = await searchParams;
  const tour = await fetchTourDetail(slug, { accessToken: access });
  if (!tour) return { title: "Тур не найден" };
  return {
    title: `${tour.title} — тур по Аргентине`,
    description: tour.shortDescription,
    robots: tour.isPrivate ? { index: false, follow: false } : undefined,
    openGraph: {
      title: tour.title,
      description: tour.shortDescription,
      images: tour.gallery.length ? [tour.image] : undefined,
      type: "website",
    },
    alternates: tour.isPrivate
      ? undefined
      : {
          canonical: `/tours/${slug}`,
        },
  };
}

export default async function TourDetailPage({ params, searchParams }: TourPageProps) {
  const { slug } = await params;
  const { access } = await searchParams;
  const tour = await fetchTourDetail(slug, { accessToken: access });
  const similarTours = tour ? await fetchSimilarTours(slug, 3) : [];
  let initialCanonicalTour = getCanonicalTourBySlug(slug) ?? null;

  if (!initialCanonicalTour && isSupabaseToursEnabled()) {
    try {
      const { fetchCanonicalTourBySlugServer } = await import("@/lib/tour-content-server");
      initialCanonicalTour = await fetchCanonicalTourBySlugServer(slug);
    } catch {
      // keep null
    }
  }

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
