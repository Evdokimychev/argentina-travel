import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import TourDetailView from "@/components/tour-detail/TourDetailView";
import TourUnavailableView from "@/components/tour-detail/TourUnavailableView";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import TourJsonLd from "@/components/seo/TourJsonLd";
import FlightOffersJsonLd from "@/components/seo/FlightOffersJsonLd";
import { buildDetailBreadcrumbItems } from "@/lib/detail-breadcrumbs";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import TourFlightLogisticsSection from "@/components/flights/TourFlightLogisticsSection";
import { fetchSimilarTours } from "@/lib/tours-server";
import { resolvePublicTourBySlug } from "@/lib/public-tour-resolver";
import { fetchPlacesServer } from "@/lib/places-repository";
import {
  fetchCutoverCanonicalTourBySlug,
  fetchCutoverPublishedTourSlugs,
} from "@/lib/tours-server-cutover";
import { resolveTourFlightRouteIds } from "@/lib/flights/destination-airports";
import { getFlightPriceTeasers } from "@/lib/flights/hub-price-teasers";
import { getFlightTeaserLabels } from "@/lib/flights/teaser-labels";
import { absoluteUrl, resolvePublicUrl } from "@/lib/site-url";
import { resolveTourCoverImage } from "@/lib/tour-metadata";
import { getTourPrivateAccessFromCookies } from "@/lib/tour-private-access";
import { buildTourSeoDescription, buildTourSeoTitle } from "@/lib/tour-seo";

export const dynamic = "force-dynamic";

interface TourPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ access?: string; departure?: string }>;
}

export const dynamicParams = true;

export async function generateStaticParams() {
  const platformSlugs = await fetchCutoverPublishedTourSlugs();

  const [tripsterSlugs, youtravelSlugs] = await Promise.all([
    import("@/lib/tripster/partner-tour-server")
      .then((mod) => mod.fetchPartnerTourSlugsServer())
      .catch(() => [] as string[]),
    import("@/lib/youtravel/partner-tour-server")
      .then((mod) => mod.fetchYouTravelTourSlugsServer())
      .catch(() => [] as string[]),
  ]);

  const merged = new Set([...platformSlugs, ...tripsterSlugs, ...youtravelSlugs]);
  return Array.from(merged).map((slug) => ({ slug }));
}

export async function generateMetadata({ params, searchParams }: TourPageProps) {
  const { slug } = await params;
  const { access: accessFromQuery } = await searchParams;
  const cookieStore = await cookies();
  const access = accessFromQuery ?? getTourPrivateAccessFromCookies(cookieStore, slug);
  const resolution = await resolvePublicTourBySlug(slug, { accessToken: access });

  if (resolution.status === "unavailable") {
    return {
      title: "Тур временно недоступен",
      description: "Источник данных временно не отвечает. Попробуйте обновить страницу позже.",
      robots: { index: false, follow: false },
    };
  }

  if (resolution.status !== "resolved") {
    notFound();
  }

  const tour = resolution.tour;
  const pageUrl = absoluteUrl(`/tours/${slug}`);
  const coverImage = resolveTourCoverImage(tour);
  const imageUrl = coverImage ? resolvePublicUrl(coverImage) : undefined;
  const seoTitle = buildTourSeoTitle(tour);
  const seoDescription = buildTourSeoDescription(tour);
  return {
    title: seoTitle,
    description: seoDescription,
    robots: tour.isPrivate ? { index: false, follow: false } : undefined,
    openGraph: {
      title: tour.title,
      description: seoDescription,
      url: pageUrl,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
      type: "website",
    },
    twitter: imageUrl
      ? {
          card: "summary_large_image",
          title: tour.title,
          description: seoDescription,
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

export default async function TourDetailPage({
  params,
  searchParams,
}: Pick<TourPageProps, "params" | "searchParams">) {
  const { slug } = await params;
  const { departure, access: accessFromQuery } = await searchParams;
  const cookieStore = await cookies();
  const access = accessFromQuery ?? getTourPrivateAccessFromCookies(cookieStore, slug);
  const resolution = await resolvePublicTourBySlug(slug, { accessToken: access });

  if (resolution.status === "unavailable") {
    return <TourUnavailableView slug={slug} errorClass={resolution.errorClass} />;
  }

  if (resolution.status === "retired" && resolution.redirectTo) {
    redirect(resolution.redirectTo);
  }

  if (resolution.status !== "resolved") {
    notFound();
  }

  const tour = resolution.tour;
  const [similarTours, initialCanonicalTour, catalogPlaces] = await Promise.all([
    fetchSimilarTours(slug, 3),
    fetchCutoverCanonicalTourBySlug(slug),
    fetchPlacesServer(),
  ]);

  const locale = await getServerI18nLocale();
  const labels = getFlightTeaserLabels(locale);
  let flightLogisticsSection: ReactNode | undefined;
  let flightOffersJsonLd: ReactNode = null;

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

  return (
    <>
      {!tour.isPrivate ? (
        <BreadcrumbListJsonLd
          items={buildDetailBreadcrumbItems(locale, "tours", {
            name: tour.title,
            path: `/tours/${slug}`,
          })}
        />
      ) : null}
      <TourJsonLd tour={tour} />
      {flightOffersJsonLd}
      <TourDetailView
        slug={slug}
        tour={tour}
        similarTours={similarTours}
        initialCanonicalTour={initialCanonicalTour}
        flightLogisticsSection={flightLogisticsSection}
        flightLogisticsNavLabel={flightLogisticsSection ? labels.tourTitle : undefined}
        initialDepartureDate={departure?.trim() || null}
        catalogPlaces={catalogPlaces}
      />
    </>
  );
}
