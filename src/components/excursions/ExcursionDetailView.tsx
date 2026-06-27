"use client";

import { useState } from "react";
import Link from "next/link";
import ExcursionReviewsSection from "@/components/excursions/ExcursionReviewsSection";
import ExcursionSimilarSection from "@/components/excursions/ExcursionSimilarSection";
import ExcursionFavoriteButton from "@/components/excursions/ExcursionFavoriteButton";
import { favoriteHeaderButtonClass } from "@/lib/favorite-button-styles";
import ExcursionContentBlocks from "@/components/excursions/ExcursionContentBlocks";
import ExcursionGuideSection from "@/components/excursions/ExcursionGuideSection";
import ExcursionAvailableDatesSection from "@/components/excursions/ExcursionAvailableDatesSection";
import ExcursionBookingConditionsSection from "@/components/excursions/ExcursionBookingConditionsSection";
import ExcursionMeetingSection from "@/components/excursions/ExcursionMeetingSection";
import ExcursionIncludedSection from "@/components/excursions/ExcursionIncludedSection";
import ExcursionMetaBadges from "@/components/excursions/ExcursionMetaBadges";
import ExcursionStatsSection from "@/components/excursions/ExcursionStatsSection";
import ExcursionSectionNav from "@/components/excursions/ExcursionSectionNav";
import ExcursionBookingPanel from "@/components/excursions/ExcursionBookingPanel";
import { ExcursionBookingProvider } from "@/components/excursions/ExcursionBookingContext";
import ExcursionBookingModal from "@/components/excursions/ExcursionBookingModal";
import ExcursionMobileBookingBar from "@/components/excursions/ExcursionMobileBookingBar";
import PageBreadcrumbs from "@/components/navigation/PageBreadcrumbs";
import TourDetailGallery from "@/components/tour-detail/TourDetailGallery";
import { PartnerInfoAutoplayGallery } from "@/components/shared/PartnerInfoAutoplayGallery";
import TourSection from "@/components/tour-detail/TourSection";
import { Clock, MapPin, Share2 } from "lucide-react";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { buildExcursionSectionLinks } from "@/lib/excursion-labels";
import { formatExcursionDuration } from "@/lib/excursion-format";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/cn";
import type { ExcursionDetail, ExcursionListing } from "@/types/excursion";
import { useTrackEntityView } from "@/hooks/useInteractionTracking";

export default function ExcursionDetailView({
  excursion,
  similarExcursions = [],
}: {
  excursion: ExcursionDetail;
  similarExcursions?: ExcursionListing[];
}) {
  const { t } = useLocaleCurrency();
  const [shared, setShared] = useState(false);
  useTrackEntityView("excursion", excursion.slug, {
    title: excursion.title,
    partner: excursion.partner,
    cityName: excursion.cityName,
  });

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

  const prefersAffiliate =
    (excursion.partner === "sputnik8" && excursion.isBookable !== false) ||
    (excursion.partner === "tripster" && excursion.tripsterPartnerApiConfigured === false);

  async function handleShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: excursion.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      // User cancelled share or clipboard unavailable
    }
  }

  return (
    <ExcursionBookingProvider excursion={excursion}>
    <div className="pb-24 lg:pb-16">
      <div className={siteContainerClass}>
        <PageBreadcrumbs
          items={[
            { label: "Главная", href: "/" },
            { label: "Экскурсии", href: "/excursions" },
            {
              label: excursion.cityName,
              href: `/excursions?query=${encodeURIComponent(excursion.cityName)}`,
            },
            { label: excursion.title },
          ]}
        />

        {galleryImages.length > 0 ? (
          <div className="mt-6">
            <TourDetailGallery
              images={galleryImages}
              title={excursion.title}
              layoutSeed={excursion.slug}
              emptyLabel="Фото экскурсии"
            />
          </div>
        ) : null}
      </div>

      <ExcursionSectionNav links={sectionLinks} />

      <div className={cn(siteContainerClass, "pt-6")}>
          <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
            <div className="min-w-0">
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

              <div className="mt-3 flex items-start justify-between gap-4">
                <h1 className="min-w-0 flex-1 font-display text-3xl font-bold text-charcoal lg:text-4xl">
                  {excursion.title}
                </h1>
                <div className="flex shrink-0 items-center gap-1.5">
                  <ExcursionFavoriteButton
                    excursion={excursion}
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

              {excursion.tagline ? (
                <p className="mt-3 text-lg text-slate">{excursion.tagline}</p>
              ) : null}

              <div className="mt-4">
                <ExcursionMetaBadges excursion={excursion} t={t} />
              </div>

              <div className="mt-6">
                <ExcursionStatsSection excursion={excursion} />
              </div>

              {excursion.partner && galleryImages.length >= 2 ? (
                <div className="mt-6">
                  <PartnerInfoAutoplayGallery
                    images={galleryImages}
                    title={excursion.title}
                  />
                </div>
              ) : null}

              <div className="mt-6 lg:hidden">
                <ExcursionBookingPanel />
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

                {excursion.placesToSee ? (
                  <TourSection id="places" title={t("excursions.section.places")}>
                    <div className="space-y-2 leading-relaxed text-charcoal/90">
                      {excursion.placesToSee.split("\n").map((line) => {
                        const text = line.trim();
                        if (!text) return null;
                        return (
                          <p key={text}>{text.startsWith("•") ? text : `• ${text}`}</p>
                        );
                      })}
                    </div>
                  </TourSection>
                ) : null}

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
                    externalProfileLabel={
                      excursion.partner === "sputnik8"
                        ? t("excursions.guide.onSputnik8")
                        : t("excursions.guide.onTripster")
                    }
                  />
                ) : null}

                <ExcursionAvailableDatesSection />

                <ExcursionBookingConditionsSection excursion={excursion} />

                <ExcursionReviewsSection
                  reviews={excursion.reviews ?? []}
                  rating={excursion.rating}
                  reviewCount={excursion.reviewCount}
                  visitorsCount={excursion.visitorsCount}
                />
              </div>
            </div>

            <aside className="hidden lg:block lg:w-full">
              <ExcursionBookingPanel />
            </aside>
          </div>

          <ExcursionSimilarSection
            excursions={similarExcursions}
            cityName={excursion.cityName}
          />
      </div>

      <ExcursionMobileBookingBar prefersAffiliate={prefersAffiliate} />
      <ExcursionBookingModal />
    </div>
    </ExcursionBookingProvider>
  );
}
