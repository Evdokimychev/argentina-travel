"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import ExcursionCard from "@/components/excursions/ExcursionCard";
import { EmptyState } from "@/components/ui/empty-state";
import { StarRating } from "@/components/ui/star-rating";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { formatGuideSinceDisplay } from "@/lib/excursion-format";
import { pluralRu } from "@/lib/pluralize";
import { siteContainerClass } from "@/lib/site-container";
import type { ExcursionGuideProfile, ExcursionListing } from "@/types/excursion";

type ExcursionGuideProfileViewProps = {
  profile: ExcursionGuideProfile;
  excursions: ExcursionListing[];
};

export default function ExcursionGuideProfileView({
  profile,
  excursions,
}: ExcursionGuideProfileViewProps) {
  const { t, locale } = useLocaleCurrency();
  const hasReviews = profile.rating != null && (profile.reviewCount ?? 0) > 0;
  const locationLabel = [profile.cityName, profile.countryName].filter(Boolean).join(", ");
  const excursionCount = profile.excursionCount ?? excursions.length;
  const excursionCountLabel = `${excursionCount} ${pluralRu(
    excursionCount,
    t("excursions.countOne"),
    t("excursions.countFew"),
    t("excursions.countMany")
  )}`;

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

        <div className="mt-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-card sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {profile.avatar ? (
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-surface-muted sm:h-28 sm:w-28">
                <Image
                  src={profile.avatar}
                  alt={profile.name}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </div>
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-sky/10 text-2xl font-bold text-sky sm:h-28 sm:w-28 sm:text-3xl">
                {profile.name.slice(0, 1).toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl font-bold text-charcoal sm:text-3xl">
                {profile.name}
              </h1>
              {locationLabel ? (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-slate">
                  <MapPin className="h-4 w-4 shrink-0 text-slate/70" aria-hidden />
                  {locationLabel}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                {hasReviews ? (
                  <StarRating
                    layout="badge"
                    score={profile.rating!.toFixed(1)}
                    count={profile.reviewCount ?? 0}
                    size="sm"
                  />
                ) : (
                  <StarRating layout="badge" isNew newLabel={t("excursions.card.new")} size="sm" />
                )}
                <span className="text-slate">{excursionCountLabel}</span>
                {profile.isLicensed ? (
                  <span className="rounded-md bg-sky/10 px-2 py-0.5 text-xs font-medium text-sky">
                    {t("excursions.guide.licensed")}
                  </span>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate">
                {profile.guideSince ? (
                  <span>
                    {t("excursions.guide.since").replace(
                      "{date}",
                      formatGuideSinceDisplay(profile.guideSince, locale)
                    )}
                  </span>
                ) : null}
                {profile.responseTimeLabel ? (
                  <span>
                    {t("excursions.guide.responseTime").replace("{time}", profile.responseTimeLabel)}
                  </span>
                ) : null}
              </div>

              {profile.url ? (
                <Link
                  href={profile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex text-sm font-medium text-sky hover:underline"
                >
                  {t("excursions.guide.onTripster")}
                </Link>
              ) : null}
            </div>
          </div>

          {profile.description ? (
            <div className="mt-8 border-t border-gray-100 pt-8">
              <p className="leading-relaxed text-slate">{profile.description}</p>
            </div>
          ) : null}
        </div>

        <section className="mt-12">
          <div className="mb-6">
            <h2 className="font-heading text-2xl font-bold text-charcoal">
              {t("excursions.guide.excursionsTitle")}
            </h2>
            <p className="mt-1 text-sm text-slate">{excursionCountLabel}</p>
          </div>

          {excursions.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {excursions.map((excursion) => (
                <ExcursionCard key={excursion.id} excursion={excursion} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={MapPin}
              title={t("excursions.guide.emptyTitle")}
              description={t("excursions.guide.emptyDescription")}
            />
          )}
        </section>
      </div>
    </div>
  );
}
