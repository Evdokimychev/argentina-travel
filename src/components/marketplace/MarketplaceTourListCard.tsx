"use client";

import Image from "next/image";
import Link from "next/link";
import FavoriteButton from "@/components/profile/FavoriteButton";
import {
  Star,
  Flame,
  MapPin,
  Sun,
  Moon,
  UserRound,
} from "lucide-react";
import { TourListing, TourBadge } from "@/types";
import TourPriceDisplay from "@/components/tour-detail/TourPriceDisplay";
import TourCardGallery from "./TourCardGallery";
import { formatDateShort } from "@/lib/utils";
import { formatDays, formatNights, formatMoreDates } from "@/lib/pluralize";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { ACTIVITY_TYPE_OPTIONS } from "@/data/activity-icons";
import { DIFFICULTY_DOT_COUNT, COMFORT_DOT_COUNT } from "@/data/tour-levels";
import { resolveListingComfortLevel } from "@/lib/tour-accommodation";
import { formatMinimumAgeShort } from "@/lib/tour-age";
import { buttonVariants } from "@/components/ui/button";

const BADGE_CONFIG: Record<TourBadge, { label: string; variant: "hot" | "new" | "hit" | "family" | "expedition" }> = {
  hot: { label: "Горящий", variant: "hot" },
  new: { label: "Новинка", variant: "new" },
  hit: { label: "Хит", variant: "hit" },
  family: { label: "Семейный", variant: "family" },
  expedition: { label: "Экспедиция", variant: "expedition" },
};

function DifficultyDots({ level }: { level: TourListing["difficultyLevel"] }) {
  const count = DIFFICULTY_DOT_COUNT[level];
  return <LevelDots count={count} />;
}

function ComfortDots({ level }: { level: TourListing["comfortLevel"] }) {
  const count = COMFORT_DOT_COUNT[level];
  return <LevelDots count={count} />;
}

function LevelDots({ count }: { count: number }) {
  return (
    <div className="mt-1 flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            i < count ? "bg-brand" : "bg-gray-200"
          )}
        />
      ))}
    </div>
  );
}

function StatCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-slate">{label}</p>
      <div className="mt-0.5 text-sm font-medium text-charcoal">{children}</div>
    </div>
  );
}

export default function MarketplaceTourListCard({ tour }: { tour: TourListing }) {
  const nextDate = tour.availableDates[0];
  const moreDates = tour.availableDates.length - 1;
  const hasReviews = tour.reviewCount > 0;
  const comfortLevel = resolveListingComfortLevel(tour);
  const activityIcon = ACTIVITY_TYPE_OPTIONS.find((o) => o.type === tour.activityType)?.icon;
  const ActivityIcon = activityIcon;
  const isIndividualOnly = tour.bookingMode === "on_request";

  return (
    <article className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-lg">
      <div className="flex flex-col lg:flex-row">
        {/* Image */}
        <Link
          href={`/tours/${tour.slug}`}
          className="relative block aspect-[16/10] shrink-0 overflow-hidden lg:aspect-auto lg:w-72 lg:min-h-[260px] xl:w-80"
        >
          <TourCardGallery images={tour.gallery} alt={tour.title} />

          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {tour.isHot && (
              <Badge variant="hot">
                <Flame className="h-3 w-3" /> Горящий
              </Badge>
            )}
            {tour.badges
              .filter((b) => !(b === "hot" && tour.isHot))
              .slice(0, 2)
              .map((b) => (
                <Badge key={b} variant={BADGE_CONFIG[b].variant}>
                  {BADGE_CONFIG[b].label}
                </Badge>
              ))}
          </div>

          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-charcoal/60 py-1 pl-1 pr-3 backdrop-blur-sm">
            <div className="relative h-7 w-7 overflow-hidden rounded-full">
              <Image
                src={tour.organizer.avatar}
                alt={tour.organizer.name}
                fill
                className="object-cover"
                sizes="28px"
              />
            </div>
            <span className="text-xs font-medium text-white">{tour.organizer.name}</span>
          </div>
        </Link>

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col p-5">
          <Link href={`/tours/${tour.slug}`} className="block min-w-0 flex-1">
            <h3 className="font-display text-lg font-bold leading-snug text-charcoal group-hover:text-brand sm:text-xl">
              {tour.title}
            </h3>

            <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-sm text-slate">
              {hasReviews ? (
                <>
                  <Star className="h-3.5 w-3.5 fill-sun text-sun" aria-hidden />
                  <span className="font-semibold text-charcoal">{tour.rating}</span>
                  <span>({tour.reviewCount})</span>
                </>
              ) : (
                <>
                  <Star className="h-3.5 w-3.5 fill-brand text-brand" aria-hidden />
                  <span className="font-medium text-brand">Новый</span>
                </>
              )}
              <span aria-hidden>·</span>
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{tour.region}</span>
            </p>

            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate">
              {tour.shortDescription}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-gray-50 px-3 py-1 text-xs font-medium text-charcoal">
                {ActivityIcon && <ActivityIcon className="h-3.5 w-3.5 text-slate" aria-hidden />}
                {tour.activityType}
              </span>
              <span className="inline-flex items-center rounded-full border border-gray-100 bg-gray-50 px-3 py-1 text-xs font-medium text-charcoal">
                {tour.groupSizeBucket}
              </span>
            </div>
          </Link>

          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-4">
            <StatCell label="Сложность">
              <span>{tour.difficultyLevel}</span>
              <DifficultyDots level={tour.difficultyLevel} />
            </StatCell>
            <StatCell label="Комфорт">
              <span>{comfortLevel}</span>
              <ComfortDots level={comfortLevel} />
            </StatCell>
            <StatCell label="Язык">{tour.language[0]}</StatCell>
            <StatCell label="Возраст">
              {formatMinimumAgeShort(tour.minimumAge)}
            </StatCell>
          </div>
        </div>

        {/* Booking panel */}
        <div className="flex shrink-0 flex-col border-t border-gray-100 p-5 lg:w-60 lg:border-l lg:border-t-0 xl:w-64">
          <div className="relative">
            <TourPriceDisplay
              priceUsd={tour.priceUsd}
              originalPriceUsd={tour.originalPriceUsd}
              size="sm"
              showFrom={false}
              className="[&_span.font-bold]:text-2xl [&_span.font-bold]:leading-tight"
            />
          </div>

          <div className="mt-3 space-y-1.5 text-sm text-charcoal">
            <p className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-sun" aria-hidden />
              {formatDays(tour.durationDays)}
            </p>
            {tour.durationNights > 0 && (
              <p className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-sky" aria-hidden />
                {formatNights(tour.durationNights)}
              </p>
            )}
          </div>

          {isIndividualOnly ? (
            <div className="mt-4">
              <p className="text-[11px] text-slate">Формат тура</p>
              <div className="mt-1.5 rounded-xl bg-sky/10 p-3">
                <p className="flex items-center gap-1.5 text-sm font-medium text-charcoal">
                  <UserRound className="h-4 w-4 shrink-0 text-sky" aria-hidden />
                  Индивидуально
                </p>
                {tour.requestDateFrom && tour.requestDateTo ? (
                  <p className="mt-1.5 text-xs leading-relaxed text-slate">
                    Любые даты с {formatDateShort(tour.requestDateFrom)} по{" "}
                    {formatDateShort(tour.requestDateTo)}
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs leading-relaxed text-slate">
                    Дата начала согласуется с организатором
                  </p>
                )}
              </div>
            </div>
          ) : (
            nextDate && (
              <div className="mt-4">
                <p className="text-[11px] text-slate">Дата набора групп</p>
                <p className="mt-0.5 text-sm font-medium text-charcoal">
                  {formatDateShort(nextDate.start)} – {formatDateShort(nextDate.end)}
                </p>
                {moreDates > 0 && (
                  <span className="mt-1.5 inline-block rounded-md bg-sky/10 px-2 py-0.5 text-xs font-medium text-sky">
                    {formatMoreDates(moreDates)}
                  </span>
                )}
              </div>
            )
          )}

          <div className="mt-auto flex items-center gap-2 pt-5">
            <Link
              href={`/tours/${tour.slug}`}
              className={buttonVariants({ className: "h-11 flex-1 rounded-xl text-sm font-semibold" })}
            >
              Смотреть тур
            </Link>
            <FavoriteButton
              tourId={tour.id}
              tourSlug={tour.slug}
              tourTitle={tour.title}
              tourImage={tour.image}
              region={tour.region}
              priceUsd={tour.priceUsd}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white transition-colors hover:bg-gray-50"
              iconClassName="h-5 w-5"
            />
          </div>
        </div>
      </div>
    </article>
  );
}
