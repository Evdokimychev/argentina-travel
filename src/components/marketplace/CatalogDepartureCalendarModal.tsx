"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  format,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight, MapPin, Moon, Sun } from "lucide-react";
import type { TourListing } from "@/types";
import FormattedPrice from "@/components/FormattedPrice";
import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog";
import { DialogPanelHeader } from "@/components/ui/dialog-panel-header";
import CalendarMonthGrid from "@/components/ui/calendar-month-grid";
import { buttonVariants } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/cn";
import { touchTargetIconClass } from "@/lib/responsive-ui";
import { formatDays, formatNights, formatSpots } from "@/lib/pluralize";
import { formatDepartureRangeCompact } from "@/lib/utils";
import {
  buildMarketplaceDepartureIndex,
  buildTourDepartureHref,
  type MarketplaceDepartureItem,
} from "@/lib/marketplace-departure-calendar";
import { TOUR_PRICE_ON_REQUEST_LABEL } from "@/lib/tour-price-public";

interface CatalogDepartureCalendarModalProps {
  tours: TourListing[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DepartureTourRow({
  item,
  onNavigate,
}: {
  item: MarketplaceDepartureItem;
  onNavigate: () => void;
}) {
  return (
    <li className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-[4.5rem] sm:w-[4.5rem]">
        <SafeImage src={item.tourImage} alt="" fill className="object-cover" sizes="80px" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 font-heading text-base font-bold leading-snug text-charcoal">
          {item.tourTitle}
        </p>
        <p className="mt-1 flex items-center gap-1 text-xs text-slate">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {item.destination}
        </p>
        <p className="mt-1.5 text-sm font-semibold text-charcoal">
          {formatDepartureRangeCompact(item.startDate, item.endDate)}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate">
          <span className="inline-flex items-center gap-1">
            <Sun className="h-3.5 w-3.5 text-sun" aria-hidden />
            {formatDays(item.durationDays)}
          </span>
          {item.durationNights > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Moon className="h-3.5 w-3.5 text-sky" aria-hidden />
              {formatNights(item.durationNights)}
            </span>
          ) : null}
          {item.spotsLeft > 0 ? <span>{formatSpots(item.spotsLeft)}</span> : null}
        </div>
      </div>

      <div className="flex w-[7.5rem] shrink-0 flex-col items-stretch gap-2 sm:w-[8.5rem]">
        {item.priceOnRequest ? (
          <p className="text-xs font-medium leading-snug text-charcoal">{TOUR_PRICE_ON_REQUEST_LABEL}</p>
        ) : (
          <p className="text-right text-base font-bold tabular-nums text-charcoal">
            <FormattedPrice priceUsd={item.priceUsd} className="inline text-base font-bold" />
          </p>
        )}
        <Link
          href={buildTourDepartureHref(item.tourSlug, item.startDate)}
          className={cn(
            buttonVariants({ size: "sm" }),
            "w-full justify-center rounded-xl px-3 text-xs font-semibold"
          )}
          onClick={onNavigate}
        >
          Смотреть
        </Link>
      </div>
    </li>
  );
}

export default function CatalogDepartureCalendarModal({
  tours,
  open,
  onOpenChange,
}: CatalogDepartureCalendarModalProps) {
  const index = useMemo(() => buildMarketplaceDepartureIndex(tours), [tours]);
  const markedDayCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const [key, items] of index.byStartDate.entries()) {
      counts.set(key, items.length);
    }
    return counts;
  }, [index.byStartDate]);

  const initialMonth = useMemo(() => {
    if (index.earliestDate) {
      const parsed = parseISO(index.earliestDate);
      if (isValid(parsed)) return startOfMonth(parsed);
    }
    return startOfMonth(new Date());
  }, [index.earliestDate]);

  const [viewMonth, setViewMonth] = useState(initialMonth);
  const [selectedDay, setSelectedDay] = useState<Date | null>(() => {
    if (!index.earliestDate) return null;
    const parsed = parseISO(index.earliestDate);
    return isValid(parsed) ? startOfDay(parsed) : null;
  });

  useEffect(() => {
    if (!open) return;
    setViewMonth(initialMonth);
    if (index.earliestDate) {
      const parsed = parseISO(index.earliestDate);
      setSelectedDay(isValid(parsed) ? startOfDay(parsed) : null);
    } else {
      setSelectedDay(null);
    }
  }, [open, initialMonth, index.earliestDate]);

  const selectedKey = selectedDay ? format(selectedDay, "yyyy-MM-dd") : null;
  const selectedDepartures = selectedKey ? index.byStartDate.get(selectedKey) ?? [] : [];
  const hasDepartures = index.totalDepartures > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        className={cn(
          "gap-0 overflow-hidden p-0 sm:rounded-3xl",
          "max-h-[100dvh] sm:max-h-[min(88vh,48rem)]",
          "sm:w-[min(calc(100dvw-2rem),72rem)] sm:max-w-[min(calc(100dvw-2rem),72rem)]",
          "sm:min-h-[min(88vh,44rem)]"
        )}
      >
        <DialogPanelHeader
          onClose={() => onOpenChange(false)}
          title="Календарь отправлений"
          description={
            hasDepartures
              ? `${index.totalDepartures} заезд${index.totalDepartures === 1 ? "" : index.totalDepartures < 5 ? "а" : "ов"} в ${index.tourCountWithDates} турах`
              : "Пока нет групповых дат в выбранной подборке"
          }
        />

        {!hasDepartures ? (
          <div className="px-6 py-10 text-center text-sm leading-relaxed text-slate">
            В текущей подборке нет туров с опубликованными датами заезда. Попробуйте сбросить
            фильтры или откройте карточку тура — у партнёрских туров Tripster даты уточняются на
            странице тура.
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 md:grid-cols-[minmax(17rem,20rem)_minmax(0,1fr)]">
            <div className="border-b border-gray-100 p-4 md:border-b-0 md:border-r md:p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setViewMonth((current) => subMonths(current, 1))}
                  className={cn(
                    touchTargetIconClass,
                    "rounded-full text-slate hover:bg-gray-100 hover:text-charcoal"
                  )}
                  aria-label="Предыдущий месяц"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <p className="text-sm font-semibold capitalize text-charcoal">
                  {format(viewMonth, "LLLL yyyy", { locale: ru })}
                </p>
                <button
                  type="button"
                  onClick={() => setViewMonth((current) => addMonths(current, 1))}
                  className={cn(
                    touchTargetIconClass,
                    "rounded-full text-slate hover:bg-gray-100 hover:text-charcoal"
                  )}
                  aria-label="Следующий месяц"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <CalendarMonthGrid
                month={viewMonth}
                selected={selectedDay}
                hideTitle
                disablePast
                markedDayCounts={markedDayCounts}
                isDateSelectable={(day) => (markedDayCounts.get(format(day, "yyyy-MM-dd")) ?? 0) > 0}
                onDayClick={(day) => setSelectedDay(startOfDay(day))}
              />

              <p className="mt-3 text-[11px] leading-relaxed text-slate">
                Точками отмечены дни начала групповых заездов. Число — сколько туров стартует в этот
                день.
              </p>
            </div>

            <div className="flex min-h-0 min-w-0 flex-col">
              <div className="border-b border-gray-100 px-5 py-3 sm:px-6 sm:py-4">
                <p className="text-sm font-semibold text-charcoal">
                  {selectedDay ? format(selectedDay, "d MMMM yyyy", { locale: ru }) : "Выберите дату"}
                </p>
                <p className="mt-0.5 text-xs text-slate">
                  {selectedDepartures.length
                    ? `${selectedDepartures.length} тур${selectedDepartures.length === 1 ? "" : selectedDepartures.length < 5 ? "а" : "ов"} с заездом в этот день`
                    : "Нет заездов в выбранный день"}
                </p>
              </div>

              <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4 sm:max-h-none sm:px-6 sm:py-5 md:min-h-[28rem]">
                {selectedDepartures.map((item) => (
                  <DepartureTourRow
                    key={`${item.tourSlug}-${item.startDate}`}
                    item={item}
                    onNavigate={() => onOpenChange(false)}
                  />
                ))}
              </ul>
            </div>
          </div>
        )}

        {index.tripsterWithoutDates > 0 ? (
          <div className="border-t border-gray-100 bg-surface-muted/40 px-5 py-3 text-xs leading-relaxed text-slate sm:px-6">
            Ещё {index.tripsterWithoutDates} тур
            {index.tripsterWithoutDates === 1 ? "" : index.tripsterWithoutDates < 5 ? "а" : "ов"}{" "}
            Tripster с датами на странице тура — откройте карточку, чтобы увидеть актуальное
            расписание.
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
