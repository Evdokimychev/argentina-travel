"use client";

import { CalendarDays, Globe, Mountain, UsersRound, type LucideIcon } from "lucide-react";
import type { PartnerTourContent } from "@/lib/tripster/partner-tour-content";
import { dateFitsGuestCount } from "@/lib/tour-booking-spots";
import {
  buildYouTravelTourDetailItems,
  formatYouTravelTravelersGoingLabel,
  listYouTravelUpcomingDepartureDates,
  resolveYouTravelDepartureCapacity,
  resolveYouTravelReferenceDate,
  resolveYouTravelTourTypeTags,
  resolveYouTravelTravelersGoingForDate,
  formatYouTravelDepartureOccupancySummary,
} from "@/lib/youtravel/partner-tour-details";
import {
  resolveYouTravelActivityDetailLabel,
  resolveYouTravelActivityLevel,
  resolveYouTravelComfortDetailLabel,
  resolveYouTravelComfortLevel,
} from "@/lib/youtravel/partner-levels";
import YouTravelGradationDetailCard from "./YouTravelGradationDetailCard";
import { ThematicTagBadges } from "@/components/marketplace/TourListingCatalogBadges";
import { formatDateRange, formatDepartureRangeCompact } from "@/lib/utils";
import type { TourDatePrice, TourDetail } from "@/types";
import { useTourBooking } from "./TourBookingContext";
import TourSection from "./TourSection";
import { cn } from "@/lib/cn";

const DETAIL_ICONS: Record<string, LucideIcon> = {
  duration: CalendarDays,
  format: Mountain,
  languages: Globe,
  age: UsersRound,
};

function DetailRow({ id, label, value }: { id: string; label: string; value: string }) {
  const Icon = DETAIL_ICONS[id] ?? Mountain;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky/10 text-sky">
        <Icon className="h-[18px] w-[18px] stroke-[1.75]" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-slate">{label}</p>
        <p className="mt-0.5 text-sm font-semibold leading-snug text-charcoal">{value}</p>
      </div>
    </div>
  );
}

function CapacityStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "booked" | "free";
}) {
  return (
    <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-2.5 text-center shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-xl font-semibold tabular-nums text-charcoal",
          tone === "booked" && "text-sky",
          tone === "free" && "text-success",
        )}
      >
        {value.toLocaleString("ru-RU")}
      </p>
    </div>
  );
}

function TravelersGoingCapacityPanel({
  capacity,
}: {
  capacity: NonNullable<ReturnType<typeof resolveYouTravelDepartureCapacity>>;
}) {
  const fillPercent = capacity.total > 0 ? Math.round((capacity.booked / capacity.total) * 100) : 0;

  return (
    <div className="mt-3 space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <CapacityStat label="В группе" value={capacity.total} />
        <CapacityStat label="Уже едут" value={capacity.booked} tone="booked" />
        <CapacityStat label="Свободно" value={capacity.free} tone="free" />
      </div>

      <div className="space-y-1.5">
        <div
          className="h-2 overflow-hidden rounded-full bg-white/80"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={capacity.total}
          aria-valuenow={capacity.booked}
          aria-label="Заполненность группы"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky to-sky/70 transition-[width] duration-300"
            style={{ width: `${Math.min(Math.max(fillPercent, 0), 100)}%` }}
          />
        </div>
        <p className="text-sm leading-snug text-slate">
          {formatYouTravelDepartureOccupancySummary(capacity)}
        </p>
      </div>
    </div>
  );
}

function TravelersGoingDateBadges({
  tour,
  dates,
  activeDateId,
  guests,
  onSelect,
}: {
  tour: TourDetail;
  dates: TourDatePrice[];
  activeDateId: string;
  guests: number;
  onSelect: (dateId: string) => void;
}) {
  if (dates.length <= 1) return null;

  return (
    <div
      className="mt-4 flex flex-wrap gap-2"
      role="radiogroup"
      aria-label="Выбор заезда"
    >
      {dates.map((date) => {
        const selected = date.id === activeDateId;
        const bookable = dateFitsGuestCount(date, guests, tour.groupMin);
        const count = resolveYouTravelTravelersGoingForDate(tour, date);

        return (
          <button
            key={date.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={!bookable}
            onClick={() => onSelect(date.id)}
            className={cn(
              "inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 text-left text-xs font-medium transition-colors",
              selected
                ? "border-sky bg-sky text-white shadow-sm"
                : "border-sky/20 bg-white text-charcoal hover:border-sky/35 hover:bg-sky/[0.06]",
              !bookable && "cursor-not-allowed opacity-50",
            )}
          >
            <span className="truncate">
              {formatDepartureRangeCompact(date.startDate, date.endDate)}
            </span>
            {count != null && count > 0 ? (
              <span
                className={cn(
                  "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                  selected ? "bg-white/20 text-white" : "bg-sky/10 text-sky",
                )}
              >
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export default function YouTravelTourDetailsSection({
  tour,
  content,
}: {
  tour: TourDetail;
  content: PartnerTourContent;
}) {
  const { selectedDateId, setSelectedDateId, scheduleDates, guests } = useTourBooking();
  const dates = scheduleDates.length > 0 ? scheduleDates : tour.dates;
  const upcomingDates = listYouTravelUpcomingDepartureDates(dates);
  const referenceDate = resolveYouTravelReferenceDate(dates, selectedDateId);
  const activeDateId = selectedDateId || referenceDate?.id || "";
  const activeDate =
    upcomingDates.find((date) => date.id === activeDateId) ?? referenceDate;
  const travelersGoing = resolveYouTravelTravelersGoingForDate(tour, activeDate);
  const capacity = resolveYouTravelDepartureCapacity(tour, activeDate);
  const hasTravelersOrCapacity = upcomingDates.some((date) => {
    return (
      resolveYouTravelTravelersGoingForDate(tour, date) != null ||
      resolveYouTravelDepartureCapacity(tour, date) != null
    );
  });

  const detailItems = buildYouTravelTourDetailItems({ tour, content });
  const tourTypeTags = resolveYouTravelTourTypeTags(tour, content);

  const activityLevel = resolveYouTravelActivityLevel(content.activityLevel);
  const activityLabel = resolveYouTravelActivityDetailLabel({
    level: content.activityLevel,
    fallbackLabel: content.activityLabel,
  });
  const comfortLevel = resolveYouTravelComfortLevel(content.comfortLevel);
  const comfortLabel = resolveYouTravelComfortDetailLabel({
    level: content.comfortLevel,
    fallbackLabel: content.comfortLabel,
  });
  const showGradationCards = Boolean(
    (activityLevel && activityLabel) || (comfortLevel && comfortLabel),
  );

  if (!detailItems.length && !showGradationCards && !hasTravelersOrCapacity && !tourTypeTags.length) {
    return null;
  }

  const showTravelersBlock =
    travelersGoing != null || capacity != null;

  return (
    <TourSection id="tour-details" title="Детали тура">
      <div className="space-y-4">
        {showTravelersBlock ? (
          <div className="rounded-2xl border border-sky/15 bg-gradient-to-br from-sky/[0.08] to-white px-5 py-4">
            <p className="text-sm font-medium text-slate">Кто уже едет</p>
            {capacity ? (
              <TravelersGoingCapacityPanel capacity={capacity} />
            ) : travelersGoing != null ? (
              <p className="mt-1 text-xl font-semibold text-charcoal">
                {formatYouTravelTravelersGoingLabel(travelersGoing)}
              </p>
            ) : null}
            {upcomingDates.length <= 1 && activeDate ? (
              <p className="mt-1 text-sm text-slate">
                заезд {formatDateRange(activeDate.startDate, activeDate.endDate)}
              </p>
            ) : null}
            <TravelersGoingDateBadges
              tour={tour}
              dates={upcomingDates}
              activeDateId={activeDateId}
              guests={guests}
              onSelect={setSelectedDateId}
            />
          </div>
        ) : null}

        {showGradationCards ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {activityLevel && activityLabel ? (
              <YouTravelGradationDetailCard
                variant="activity"
                title="Активность"
                displayLabel={activityLabel}
                level={activityLevel}
              />
            ) : null}
            {comfortLevel && comfortLabel ? (
              <YouTravelGradationDetailCard
                variant="comfort"
                title="Комфорт"
                displayLabel={comfortLabel}
                level={comfortLevel}
              />
            ) : null}
          </div>
        ) : null}

        {detailItems.length ? (
          <div className={cn("grid gap-3 sm:grid-cols-2")}>
            {detailItems.map((item) => (
              <DetailRow key={item.id} id={item.id} label={item.label} value={item.value} />
            ))}
          </div>
        ) : null}

        {tourTypeTags.length ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
            <p className="text-sm text-slate">Тип тура</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ThematicTagBadges tags={tourTypeTags} />
            </div>
          </div>
        ) : null}
      </div>
    </TourSection>
  );
}
