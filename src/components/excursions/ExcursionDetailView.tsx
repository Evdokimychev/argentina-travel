"use client";

import Link from "next/link";
import ExcursionReviewsSection from "@/components/excursions/ExcursionReviewsSection";
import ExcursionSimilarSection from "@/components/excursions/ExcursionSimilarSection";
import ExcursionFavoriteButton from "@/components/excursions/ExcursionFavoriteButton";
import ExcursionContentBlocks from "@/components/excursions/ExcursionContentBlocks";
import ExcursionGuideSection from "@/components/excursions/ExcursionGuideSection";
import ExcursionBookingConditionsSection from "@/components/excursions/ExcursionBookingConditionsSection";
import ExcursionMeetingSection from "@/components/excursions/ExcursionMeetingSection";
import ExcursionIncludedSection from "@/components/excursions/ExcursionIncludedSection";
import ExcursionMetaBadges from "@/components/excursions/ExcursionMetaBadges";
import ExcursionSectionNav from "@/components/excursions/ExcursionSectionNav";
import ExcursionBookingPanel from "@/components/excursions/ExcursionBookingPanel";
import TourDetailGallery from "@/components/tour-detail/TourDetailGallery";
import { ArrowLeft, Clock, MapPin } from "lucide-react";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { buildExcursionSectionLinks } from "@/lib/excursion-labels";
import { formatExcursionDuration } from "@/lib/excursion-format";
import { siteContainerClass } from "@/lib/site-container";
import type { ExcursionDetail, ExcursionListing } from "@/types/excursion";

export default function ExcursionDetailView({
  excursion,
  similarExcursions = [],
}: {
  excursion: ExcursionDetail;
  similarExcursions?: ExcursionListing[];
}) {
  const { t } = useLocaleCurrency();

  const galleryImages = (
    excursion.photos.length
      ? excursion.photos.map((photo) => photo.medium || photo.thumbnail).filter(Boolean)
      : excursion.coverImage
        ? [excursion.coverImage]
        : []
  ) as string[];

  const durationLabel = formatExcursionDuration(excursion.durationMinutes, t);
  const sectionLinks = buildExcursionSectionLinks(excursion).map((link) => ({
    id: link.id,
    label: t(link.labelKey),
  }));

  return (
    <div className="pb-16">
      <div className={siteContainerClass}>
        <Link
          href="/excursions"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate transition hover:text-sky"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("excursions.backToAll")}
        </Link>

        <div className="mt-6">
          {galleryImages.length > 0 ? (
            <TourDetailGallery images={galleryImages} title={excursion.title} />
          ) : null}

          <ExcursionSectionNav links={sectionLinks} />

          <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
            <div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" aria-hidden />
                  <Link href={`/excursions/city/${excursion.citySlug}`} className="hover:text-sky">
                    {excursion.cityName}
                  </Link>
                </span>
                {durationLabel ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-4 w-4" aria-hidden />
                    {durationLabel}
                  </span>
                ) : null}
              </div>

              <h1 className="mt-3 font-display text-3xl font-bold text-charcoal lg:text-4xl">
                {excursion.title}
              </h1>

              {excursion.tagline ? (
                <p className="mt-3 text-lg text-slate">{excursion.tagline}</p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <ExcursionFavoriteButton
                  excursion={excursion}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-charcoal transition hover:border-sky/40 hover:text-sky"
                  iconClassName="h-4 w-4"
                />
              </div>

              <div className="mt-4">
                <ExcursionMetaBadges excursion={excursion} t={t} />
              </div>

              {excursion.comfortLevelInfo ? (
                <p className="mt-6 rounded-2xl bg-surface-muted/60 px-4 py-3 text-sm leading-relaxed text-charcoal/90">
                  {excursion.comfortLevelInfo}
                </p>
              ) : null}

              <div className="mt-10 space-y-10">
                <div id="program">
                  <ExcursionContentBlocks
                    blocks={excursion.descriptionBlocks}
                    annotation={excursion.annotation}
                    description={excursion.description}
                    summaryTitle={t("excursions.section.summary")}
                    descriptionTitle={t("excursions.section.description")}
                  />
                </div>

                <ExcursionMeetingSection
                  meetingPoint={excursion.meetingPoint}
                  finishPoint={excursion.finishPoint}
                  title={t("excursions.section.meeting")}
                  meetingLabel={t("excursions.meeting.start")}
                  finishLabel={t("excursions.meeting.finish")}
                />

                <ExcursionIncludedSection
                  included={excursion.priceIncluded}
                  excluded={excursion.priceExcluded}
                  title={t("excursions.section.included")}
                  includedLabel={t("excursions.included.yes")}
                  excludedLabel={t("excursions.included.no")}
                />

                {excursion.guide ? (
                  <ExcursionGuideSection
                    guide={excursion.guide}
                    title={t("excursions.section.guide")}
                    profileLabel={t("excursions.guide.profile")}
                    externalProfileLabel={t("excursions.guide.onTripster")}
                  />
                ) : null}

                <ExcursionBookingConditionsSection excursion={excursion} />

                <ExcursionReviewsSection
                  reviews={excursion.reviews ?? []}
                  rating={excursion.rating}
                  reviewCount={excursion.reviewCount}
                  visitorsCount={excursion.visitorsCount}
                />
              </div>
            </div>

            <ExcursionBookingPanel excursion={excursion} />
          </div>

          <ExcursionSimilarSection
            excursions={similarExcursions}
            cityName={excursion.cityName}
          />
        </div>
      </div>
    </div>
  );
}
