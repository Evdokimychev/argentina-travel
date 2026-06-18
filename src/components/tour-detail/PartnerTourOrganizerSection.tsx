"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { StarRating } from "@/components/ui/star-rating";
import { formatGuideSinceDisplay } from "@/lib/excursion-format";
import { buildExcursionGuideHref } from "@/lib/tripster/guide-mapper";
import { formatYears, pluralRu } from "@/lib/pluralize";
import { cn } from "@/lib/cn";
import TourSection from "./TourSection";
import { tourDetailCardBorderClass } from "@/lib/tour-detail-ui";
import type { ExcursionGuideProfile } from "@/types/excursion";
import type { TourOrganizerDetail } from "@/types";

const DESCRIPTION_PREVIEW_LENGTH = 280;

function resolveGuideTenureLabel(guideSince: string | undefined, locale: string): string | null {
  if (!guideSince?.trim()) return null;

  const trimmed = guideSince.trim();
  if (/^\d{4}$/.test(trimmed)) {
    const years = new Date().getFullYear() - Number.parseInt(trimmed, 10);
    if (years >= 1) return `${formatYears(years)} на Tripster`;
  }

  const formatted = formatGuideSinceDisplay(trimmed, locale);
  if (!formatted) return null;
  return `На Tripster с ${formatted}`;
}

function resolveVisitorLabel(count: number): string | null {
  if (count <= 0) return null;
  return `${count} ${pluralRu(count, "посетил", "посетили", "посетили")}`;
}

function resolveOfferLabel(count: number): string {
  return `${count} ${pluralRu(count, "предложение", "предложения", "предложений")}`;
}

export default function PartnerTourOrganizerSection({
  guide,
  organizer,
}: {
  guide: ExcursionGuideProfile;
  organizer: TourOrganizerDetail;
}) {
  const locale = "ru-RU";
  const [expanded, setExpanded] = useState(false);

  const description = guide.description?.trim() || organizer.extendedDescription?.trim() || "";
  const canExpand = description.length > DESCRIPTION_PREVIEW_LENGTH;
  const visibleDescription =
    expanded || !canExpand
      ? description
      : `${description.slice(0, DESCRIPTION_PREVIEW_LENGTH).trim()}…`;

  const offerCount = Math.max(guide.excursionCount ?? 0, organizer.tourCount);
  const hasReviews = (organizer.reviewCount ?? 0) > 0 && organizer.rating > 0;
  const visitorLabel = resolveVisitorLabel(organizer.travelerCount);
  const tenureLabel = resolveGuideTenureLabel(guide.guideSince, locale);
  const profileHref = guide.url?.trim() || buildExcursionGuideHref(guide.id);
  const profileIsExternal = Boolean(guide.url?.trim());

  return (
    <TourSection id="organizer" title="Организатор">
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
            <span className="rounded-full bg-sky/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky">
              {organizer.role || "Гид"}
            </span>

            <Link
              href={profileHref}
              target={profileIsExternal ? "_blank" : undefined}
              rel={profileIsExternal ? "noopener noreferrer" : undefined}
              className="mt-3 block text-xl font-bold text-charcoal transition hover:text-sky sm:text-2xl"
            >
              {guide.name}
            </Link>

            <p className="mt-1 text-sm text-slate">
              Партнёрский многодневный тур · бронирование на Tripster
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {hasReviews ? (
                <StarRating
                  layout="badge"
                  score={organizer.rating.toFixed(2).replace(".", ",")}
                  count={organizer.reviewCount ?? 0}
                  size="sm"
                />
              ) : (
                <StarRating layout="badge" isNew newLabel="Новый гид" size="sm" />
              )}
              {visitorLabel ? <span className="text-slate">{visitorLabel}</span> : null}
              {tenureLabel ? <span className="text-slate">{tenureLabel}</span> : null}
              {offerCount > 0 ? (
                <span className="text-slate">{resolveOfferLabel(offerCount)}</span>
              ) : null}
            </div>

            {organizer.languages.length > 0 ? (
              <p className="mt-2 text-sm text-slate">Языки: {organizer.languages.join(", ")}</p>
            ) : null}

            {description ? (
              <div className="mt-4">
                <p className="text-sm leading-relaxed text-charcoal/90">{visibleDescription}</p>
                {canExpand ? (
                  <button
                    type="button"
                    onClick={() => setExpanded((value) => !value)}
                    className="mt-2 text-sm font-medium text-sky hover:text-sky-dark"
                  >
                    {expanded ? "Свернуть" : "Ещё"}
                  </button>
                ) : null}
              </div>
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
                href={profileHref}
                target={profileIsExternal ? "_blank" : undefined}
                rel={profileIsExternal ? "noopener noreferrer" : undefined}
                className="rounded-xl bg-sky px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-dark"
              >
                {offerCount > 0 ? `Все предложения · ${offerCount}` : "Профиль на Tripster"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </TourSection>
  );
}
