"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { formatGuideSinceDisplay } from "@/lib/excursion-format";
import { buildExcursionGuideHref } from "@/lib/tripster/guide-mapper";
import { pluralRu } from "@/lib/pluralize";
import { cn } from "@/lib/cn";
import TourSection from "@/components/tour-detail/TourSection";
import type { ExcursionGuideProfile } from "@/types/excursion";

export default function ExcursionGuideSection({
  guide,
  title,
  profileLabel,
  externalProfileLabel,
}: {
  guide: ExcursionGuideProfile;
  title: string;
  profileLabel: string;
  externalProfileLabel?: string;
}) {
  const { t, locale } = useLocaleCurrency();
  const profileHref = buildExcursionGuideHref(guide.id);
  const hasReviews = guide.rating != null && (guide.reviewCount ?? 0) > 0;
  const locationLabel = [guide.cityName, guide.countryName].filter(Boolean).join(", ");
  const excursionCount = guide.excursionCount;
  const excursionCountLabel =
    excursionCount != null
      ? `${excursionCount} ${pluralRu(
          excursionCount,
          t("excursions.countOne"),
          t("excursions.countFew"),
          t("excursions.countMany")
        )}`
      : null;

  return (
    <TourSection id="guide" title={title}>
      <div className="rounded-2xl border border-gray-100 bg-surface-muted/30 p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Link href={profileHref} className="shrink-0 self-start">
            {guide.avatar ? (
              <div className="relative h-20 w-20 overflow-hidden rounded-full bg-white ring-2 ring-sky/15 sm:h-24 sm:w-24">
                <Image
                  src={guide.avatar}
                  alt={guide.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sky/10 text-2xl font-bold text-sky ring-2 ring-sky/15 sm:h-24 sm:w-24">
                {guide.name.slice(0, 1).toUpperCase()}
              </div>
            )}
          </Link>

          <div className="min-w-0 flex-1">
            <Link
              href={profileHref}
              className="font-heading text-xl font-bold text-charcoal transition hover:text-sky sm:text-2xl"
            >
              {guide.name}
            </Link>

            {locationLabel ? (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-slate">
                <MapPin className="h-4 w-4 shrink-0 text-slate/70" aria-hidden />
                {locationLabel}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {hasReviews ? (
                <StarRating
                  layout="badge"
                  score={guide.rating!.toFixed(1)}
                  count={guide.reviewCount ?? 0}
                  size="sm"
                />
              ) : (
                <StarRating layout="badge" isNew newLabel={t("excursions.card.new")} size="sm" />
              )}
              {excursionCountLabel ? (
                <span className="text-slate">{excursionCountLabel}</span>
              ) : null}
              {guide.isLicensed ? (
                <span className="rounded-md bg-sky/10 px-2 py-0.5 text-xs font-medium text-sky">
                  {t("excursions.guide.licensed")}
                </span>
              ) : null}
            </div>

            {(guide.guideSince || guide.responseTimeLabel) && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate">
                {guide.guideSince ? (
                  <span>
                    {t("excursions.guide.since").replace(
                      "{date}",
                      formatGuideSinceDisplay(guide.guideSince, locale)
                    )}
                  </span>
                ) : null}
                {guide.responseTimeLabel ? (
                  <span>
                    {t("excursions.guide.responseTime").replace(
                      "{time}",
                      guide.responseTimeLabel
                    )}
                  </span>
                ) : null}
              </div>
            )}

            {guide.description ? (
              <p className="mt-4 text-sm leading-relaxed text-charcoal/90 line-clamp-4">
                {guide.description}
              </p>
            ) : null}

            <div className={cn("flex flex-wrap gap-3", guide.description ? "mt-5" : "mt-4")}>
              <Link href={profileHref}>
                <Button size="sm">{profileLabel}</Button>
              </Link>
              {guide.url && externalProfileLabel ? (
                <Link
                  href={guide.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm font-medium text-slate transition hover:text-sky"
                >
                  {externalProfileLabel}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </TourSection>
  );
}
