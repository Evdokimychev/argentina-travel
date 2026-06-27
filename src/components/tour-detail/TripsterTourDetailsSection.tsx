"use client";

import { CalendarDays, Globe, Mountain, UsersRound, type LucideIcon } from "lucide-react";
import type { PartnerTourContent } from "@/lib/tripster/partner-tour-content";
import {
  buildTripsterTourDetailItems,
  listTripsterUpcomingDepartureDates,
  resolveTripsterDepartureCapacity,
  resolveTripsterReferenceDate,
} from "@/lib/tripster/partner-tour-details";
import { dateFitsGuestCount } from "@/lib/tour-booking-spots";
import PartnerTourCapacityPanel from "./PartnerTourCapacityPanel";
import { formatDateRange, formatDepartureRangeCompact } from "@/lib/utils";
import type { TourDatePrice, TourDetail } from "@/types";
import { useTourBooking } from "./TourBookingContext";
import TourSection from "./TourSection";
import { cn } from "@/lib/cn";

const DETAIL_ICONS: Record<string, LucideIcon> = {
  duration: CalendarDays,
  format: Mountain,
  movement: Mountain,
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

function DepartureDateBadges({
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
    <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Выбор заезда">
      {dates.map((date) => {
        const selected = date.id === activeDateId;
        const bookable = dateFitsGuestCount(date, guests, tour.groupMin);
        const capacity = resolveTripsterDepartureCapacity(tour, date);

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
            {capacity && capacity.booked > 0 ? (
              <span
                className={cn(
                  "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                  selected ? "bg-white/20 text-white" : "bg-sky/10 text-sky",
                )}
              >
                {capacity.booked}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export default function TripsterTourDetailsSection({
  tour,
  content,
}: {
  tour: TourDetail;
  content: PartnerTourContent;
}) {
  const { selectedDateId, setSelectedDateId, scheduleDates, guests } = useTourBooking();
  const dates = scheduleDates.length > 0 ? scheduleDates : tour.dates;
  const upcomingDates = listTripsterUpcomingDepartureDates(dates);
  const referenceDate = resolveTripsterReferenceDate(dates, selectedDateId);
  const activeDateId = selectedDateId || referenceDate?.id || "";
  const activeDate = upcomingDates.find((date) => date.id === activeDateId) ?? referenceDate;
  const capacity = resolveTripsterDepartureCapacity(tour, activeDate);
  const hasCapacity = upcomingDates.some(
    (date) => resolveTripsterDepartureCapacity(tour, date) != null,
  );

  const detailItems = buildTripsterTourDetailItems({ tour, content });

  if (!detailItems.length && !hasCapacity) {
    return null;
  }

  return (
    <TourSection id="tour-details" title="Детали тура">
      <div className="space-y-4">
        {hasCapacity ? (
          <div className="rounded-2xl border border-sky/15 bg-gradient-to-br from-sky/[0.08] to-white px-5 py-4">
            <p className="text-sm font-medium text-slate">Кто уже едет</p>
            {capacity ? <PartnerTourCapacityPanel capacity={capacity} /> : null}
            {upcomingDates.length <= 1 && activeDate ? (
              <p className="mt-1 text-sm text-slate">
                заезд {formatDateRange(activeDate.startDate, activeDate.endDate)}
              </p>
            ) : null}
            <DepartureDateBadges
              tour={tour}
              dates={upcomingDates}
              activeDateId={activeDateId}
              guests={guests}
              onSelect={setSelectedDateId}
            />
          </div>
        ) : null}

        {detailItems.length ? (
          <div className={cn("grid gap-3 sm:grid-cols-2")}>
            {detailItems.map((item) => (
              <DetailRow key={item.id} id={item.id} label={item.label} value={item.value} />
            ))}
          </div>
        ) : null}
      </div>
    </TourSection>
  );
}
