"use client";

import Image from "next/image";
import Link from "next/link";
import ExpandableText from "@/components/ui/expandable-text";
import { ReviewRatingBadge } from "@/components/ui/review-rating-badge";
import { formatGuideSinceDisplay } from "@/lib/excursion-format";
import {
  buildPartnerGuideCatalogHref,
  splitGuideDescriptionParagraphs,
} from "@/lib/tripster/guide-mapper";
import { buildYouTravelExpertCatalogHref } from "@/lib/youtravel/partner-tour-guide";
import { formatYears, pluralRu } from "@/lib/pluralize";
import { cn } from "@/lib/cn";
import TourSection from "./TourSection";
import { tourDetailCardBorderClass } from "@/lib/tour-detail-ui";
import type { ExcursionGuideProfile } from "@/types/excursion";
import type { TourOrganizerDetail } from "@/types";

function yearsOnPlatform(rawSince: string, now = new Date()): number | null {
  const parsed = new Date(rawSince.trim());
  if (Number.isNaN(parsed.getTime())) return null;

  let years = now.getFullYear() - parsed.getFullYear();
  const monthDiff = now.getMonth() - parsed.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < parsed.getDate())) {
    years -= 1;
  }
  return Math.max(0, years);
}

function resolveGuideTenureLabel(
  guideSince: string | undefined,
  locale: string,
  partnerSource: "tripster" | "youtravel"
): string | null {
  if (!guideSince?.trim()) return null;

  const platformName = partnerSource === "youtravel" ? "YouTravel.me" : "Tripster";
  const trimmed = guideSince.trim();
  if (/^\d{4}$/.test(trimmed)) {
    const years = new Date().getFullYear() - Number.parseInt(trimmed, 10);
    if (years >= 1) return `${formatYears(years)} на ${platformName}`;
  }

  const years = yearsOnPlatform(trimmed);
  if (years != null && years >= 1) {
    return `${formatYears(years)} на ${platformName}`;
  }

  const formatted = formatGuideSinceDisplay(trimmed, locale);
  if (!formatted) return null;
  return `На ${platformName} с ${formatted}`;
}

function resolveVisitorLabel(count: number): string | null {
  if (count <= 0) return null;
  return `${count} ${pluralRu(count, "посетил", "посетили", "посетили")}`;
}

function resolveOfferLabel(count: number, partnerSource: "tripster" | "youtravel"): string {
  if (partnerSource === "youtravel") {
    return `${count} ${pluralRu(count, "тур", "тура", "туров")}`;
  }
  return `${count} ${pluralRu(count, "предложение", "предложения", "предложений")}`;
}

export default function PartnerTourOrganizerSection({
  guide,
  organizer,
  partnerSource = "tripster",
}: {
  guide: ExcursionGuideProfile;
  organizer: TourOrganizerDetail;
  partnerSource?: "tripster" | "youtravel";
}) {
  const locale = "ru-RU";

  const paragraphs =
    guide.descriptionParagraphs?.length
      ? guide.descriptionParagraphs
      : splitGuideDescriptionParagraphs(
          guide.description?.trim() || organizer.extendedDescription?.trim() || ""
        );

  const offerCount = Math.max(guide.excursionCount ?? 0, organizer.tourCount);
  const hasReviews = (organizer.reviewCount ?? 0) > 0 && organizer.rating > 0;
  const visitorLabel = resolveVisitorLabel(organizer.travelerCount);
  const tenureLabel = resolveGuideTenureLabel(
    guide.guideSince ?? organizer.platformRegisteredAt,
    locale,
    partnerSource
  );
  const catalogHref =
    partnerSource === "youtravel"
      ? buildYouTravelExpertCatalogHref(guide.id)
      : buildPartnerGuideCatalogHref(guide.id);
  const profileHref = guide.url?.trim() || catalogHref;
  const profileIsExternal = Boolean(guide.url?.trim());
  const roleLabel = organizer.role?.trim() || guide.roleLabel || "Гид";
  const statusLine =
    guide.tagline?.trim() ||
    organizer.shortDescription?.trim() ||
    (partnerSource === "youtravel"
      ? "Авторский многодневный тур · бронирование на YouTravel.me"
      : "Партнёрский многодневный тур · бронирование на Tripster");
  const sectionTitle = partnerSource === "youtravel" ? "Организатор туров" : "Организатор";
  const catalogButtonLabel =
    partnerSource === "youtravel"
      ? offerCount > 0
        ? `Все туры эксперта · ${offerCount}`
        : "Все туры эксперта"
      : offerCount > 0
        ? `Все предложения · ${offerCount}`
        : "Туры в Аргентине";

  return (
    <TourSection id="organizer" title={sectionTitle}>
      <div className={cn(tourDetailCardBorderClass, "bg-surface-muted/30 p-6 sm:p-8")}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <Link
            href={profileHref}
            target={profileIsExternal ? "_blank" : undefined}
            rel={profileIsExternal ? "noopener noreferrer" : undefined}
            className="shrink-0"
          >
            {guide.avatar || organizer.avatar ? (
              <div className="relative h-20 w-20 overflow-hidden rounded-full bg-white ring-2 ring-sky/15 sm:h-24 sm:w-24">
                <Image
                  src={guide.avatar || organizer.avatar}
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
              target={profileIsExternal ? "_blank" : undefined}
              rel={profileIsExternal ? "noopener noreferrer" : undefined}
              className="block text-xl font-bold text-charcoal transition hover:text-sky sm:text-2xl"
            >
              {guide.name}
            </Link>

            <p className="mt-1 text-sm text-slate">{roleLabel}</p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {hasReviews ? (
                <ReviewRatingBadge
                  score={organizer.rating.toFixed(1).replace(".", ",")}
                  reviewCount={organizer.reviewCount ?? 0}
                  size="sm"
                />
              ) : (
                <ReviewRatingBadge isNew newLabel="Новый гид" size="sm" />
              )}
              {visitorLabel ? <span className="text-slate">{visitorLabel}</span> : null}
              {tenureLabel ? <span className="text-slate">{tenureLabel}</span> : null}
              {offerCount > 0 ? (
                <span className="text-slate">{resolveOfferLabel(offerCount, partnerSource)}</span>
              ) : null}
            </div>

            {organizer.languages.length > 0 ? (
              <p className="mt-2 text-sm text-slate">Языки: {organizer.languages.join(", ")}</p>
            ) : null}

            {paragraphs.length ? (
              <ExpandableText
                paragraphs={paragraphs}
                className="mt-4"
                paragraphClassName="text-sm leading-relaxed text-charcoal/90"
              />
            ) : statusLine ? (
              <p className="mt-4 text-sm leading-relaxed text-charcoal/90">{statusLine}</p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              {guide.url ? (
                <a
                  href={guide.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
                >
                  Задать вопрос
                </a>
              ) : (
                <Link
                  href="/contacts"
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
                >
                  Написать
                </Link>
              )}
              <Link
                href={catalogHref}
                className="rounded-xl bg-sky px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-dark"
              >
                {catalogButtonLabel}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </TourSection>
  );
}
