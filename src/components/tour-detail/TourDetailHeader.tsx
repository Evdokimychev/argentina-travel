"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, MapPin, Share2 } from "lucide-react";
import { TourDetail } from "@/types";
import type { Tour } from "@/types/tour";
import FavoriteButton from "@/components/profile/FavoriteButton";
import PageBreadcrumbs from "@/components/navigation/PageBreadcrumbs";
import { favoriteHeaderButtonClass } from "@/lib/favorite-button-styles";
import { ReviewRatingBadge } from "@/components/ui/review-rating-badge";
import { cn } from "@/lib/cn";
import {
  hasTourEndpointLabels,
  resolveTourEndpointLabels,
} from "@/lib/tour-route-endpoints";
import { siteContainerClass } from "@/lib/site-container";
import { scrollToSiteAnchor } from "@/lib/scroll-anchor";
import {
  resolveArgentinaProvinceName,
} from "@/lib/argentina-cities";
import { formatTourLocationCompactPlain } from "@/lib/geo";
import { resolveTourRatingLabel } from "@/lib/tour-public-display";
import { deriveTourReviewStats, stripStaticSeedReviews } from "@/lib/tour-review-stats";
import { plainTextFromRichContent } from "@/lib/rich-text";
import TourClassificationBar from "./TourClassificationBar";
import TourDurationInfo from "./TourDurationInfo";
import TourRouteEndpointsChip from "./TourRouteEndpointsChip";
import { SafeImage } from "@/components/ui/safe-image";
import { isPartnerTourDetail } from "@/lib/tripster/partner-tour-utils";

interface TourDetailHeaderProps {
  tour: TourDetail;
  canonicalTour?: Tour | null;
}

export default function TourDetailHeader({ tour, canonicalTour }: TourDetailHeaderProps) {
  const [shared, setShared] = useState(false);
  const isPartnerTour = isPartnerTourDetail(tour);
  const reviewStats = deriveTourReviewStats(stripStaticSeedReviews(tour.reviews));
  const ratingDisplay = resolveTourRatingLabel(reviewStats);
  const cityDisplay = formatTourLocationCompactPlain({
    destination: canonicalTour?.geography.destination,
    mainLocation: canonicalTour?.geography.mainLocation,
    cities: canonicalTour?.geography.cities,
    region: tour.region,
    country: tour.country,
    title: tour.title,
  });
  const provinceLabel = resolveArgentinaProvinceName(tour.region);
  const routeEndpoints = resolveTourEndpointLabels(tour);
  const showRouteEndpoints = hasTourEndpointLabels(routeEndpoints);

  async function handleShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: tour.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      // User cancelled share or clipboard unavailable
    }
  }

  function scrollToReviews() {
    scrollToSiteAnchor("reviews");
  }

  return (
    <section
      data-scroll-rail-tone="light"
      className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-br from-surface-muted via-white to-sky/[0.06]"
    >
      <div
        className="pointer-events-none absolute -right-16 top-8 h-56 w-56 rounded-full bg-sky/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-sun/10 blur-3xl"
        aria-hidden
      />

      <div className={cn(siteContainerClass, "relative py-6 md:py-8 lg:py-10")}>
        <PageBreadcrumbs
          items={[
            { label: "Главная", href: "/" },
            { label: "Авторские туры", href: "/tours" },
            { label: provinceLabel },
            { label: tour.title },
          ]}
        />

        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_min(42%,400px)] xl:grid-cols-[minmax(0,1fr)_420px] xl:gap-10">
          <div className="min-w-0">
            <Link
              href="/tours"
              className="group inline-flex items-center gap-1.5 rounded-full border border-sky/15 bg-sky/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky transition-colors hover:border-sky/30 hover:bg-sky/10"
            >
              {cityDisplay}
              <ArrowUpRight
                className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>

            <div className="mt-4 flex items-start justify-between gap-4">
              <h1 className="min-w-0 flex-1 font-display text-3xl font-bold leading-[1.12] tracking-tight text-charcoal sm:text-4xl lg:text-[2.35rem]">
                {tour.title}
              </h1>
              <div className="flex shrink-0 items-center gap-1.5">
                <FavoriteButton
                  tourId={tour.id}
                  tourSlug={tour.slug}
                  tourTitle={tour.title}
                  tourImage={tour.image}
                  region={tour.region}
                  country={tour.country}
                  priceUsd={tour.priceUsd}
                  className={favoriteHeaderButtonClass}
                  iconClassName="h-4 w-4"
                />
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label={shared ? "Ссылка скопирована" : "Поделиться"}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200/80 bg-white/90 text-charcoal shadow-sm transition-colors hover:border-sky/30 hover:bg-white"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {tour.shortDescription?.trim() ? (
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate sm:text-[1.05rem]">
                {plainTextFromRichContent(tour.shortDescription)}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <TourDurationInfo
                days={tour.durationDays}
                nights={tour.durationNights}
                hideNights={isPartnerTour}
              />

              <p className="inline-flex items-center gap-1.5 text-sm text-slate">
                <MapPin className="h-4 w-4 shrink-0 text-sky/70" aria-hidden />
                <span>{cityDisplay}</span>
              </p>

              {showRouteEndpoints ? (
                <TourRouteEndpointsChip endpoints={routeEndpoints} />
              ) : null}

              {ratingDisplay.hasReviews ? (
                <ReviewRatingBadge
                  score={ratingDisplay.ratingText}
                  reviewCount={reviewStats.reviewCount}
                  size="md"
                  onClick={scrollToReviews}
                />
              ) : (
                <ReviewRatingBadge
                  isNew
                  newLabel={ratingDisplay.badgeLabel}
                  size="md"
                  onClick={scrollToReviews}
                />
              )}
            </div>

            {canonicalTour ? (
              <div className="mt-5">
                <TourClassificationBar tour={canonicalTour} />
              </div>
            ) : null}
          </div>

          <div className="relative mx-auto hidden w-full max-w-md lg:mx-0 lg:block lg:max-w-none">
            <div
              className="pointer-events-none absolute -bottom-3 -left-3 hidden h-[calc(100%-0.5rem)] w-[calc(100%-0.5rem)] rounded-2xl border border-sky/20 lg:block"
              aria-hidden
            />
            <div className="relative overflow-hidden rounded-2xl bg-charcoal/5 shadow-card ring-1 ring-gray-100">
              <div className="relative aspect-[4/3] w-full sm:aspect-[16/10] lg:aspect-[4/3]">
                <SafeImage
                  src={tour.image}
                  alt={tour.title}
                  fill
                  priority
                  fetchPriority="high"
                  placeholderVariant="tour"
                  sizes="(max-width: 1024px) 100vw, 420px"
                  className="object-cover"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-charcoal/20 via-transparent to-transparent"
                  aria-hidden
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
