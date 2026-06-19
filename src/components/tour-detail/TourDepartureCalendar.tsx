"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { TourDatePrice } from "@/types";
import FormattedPrice from "@/components/FormattedPrice";
import { cn } from "@/lib/cn";
import { formatDateRange } from "@/lib/utils";
import { formatDays, formatForTourists, formatNights, formatSpots } from "@/lib/pluralize";
import { dateFitsGuestCount } from "@/lib/tour-booking-spots";
import {
  buildDepartureCalendarMap,
  countTourDepartureDays,
  countTourDepartureNights,
  eachTourDepartureDateKey,
  formatCompactUsd,
  resolveTourDepartureEndDate,
} from "@/lib/tour-date-pricing";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

interface TourDepartureCalendarProps {
  dates: TourDatePrice[];
  selectedDateId: string;
  onSelect: (date: TourDatePrice) => void;
  guests: number;
  groupMin: number;
  durationDays?: number;
  priceOnRequest?: boolean;
  showSidebar?: boolean;
  className?: string;
}

function parseStartDate(value: string): Date | null {
  const parsed = parseISO(value);
  return isValid(parsed) ? startOfDay(parsed) : null;
}

function getRangeBarCaps(
  inRange: boolean,
  isGlobalStart: boolean,
  isGlobalEnd: boolean,
  columnIndex: number,
  isSingleDay: boolean
): { roundLeft: boolean; roundRight: boolean } | null {
  if (!inRange) return null;
  if (isSingleDay) return { roundLeft: true, roundRight: true };
  return {
    roundLeft: isGlobalStart || columnIndex === 0,
    roundRight: isGlobalEnd || columnIndex === 6,
  };
}

function CalendarLegend() {
  return (
    <ul className="space-y-1.5 text-[11px] text-slate">
      <li className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-md bg-sky" aria-hidden />
        Начало тура
      </li>
      <li className="flex items-center gap-2">
        <span className="h-3 w-8 rounded-full bg-sky/20" aria-hidden />
        Дни программы
      </li>
      <li className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-md border border-sky/25 bg-sky/5" aria-hidden />
        Доступный заезд
      </li>
    </ul>
  );
}

export default function TourDepartureCalendar({
  dates,
  selectedDateId,
  onSelect,
  guests,
  groupMin,
  durationDays,
  priceOnRequest = false,
  showSidebar = true,
  className,
}: TourDepartureCalendarProps) {
  const departureMap = useMemo(() => buildDepartureCalendarMap(dates), [dates]);
  const selectedDate = dates.find((item) => item.id === selectedDateId);

  const selectedRange = useMemo(() => {
    if (!selectedDate?.startDate) return null;
    const endKey = resolveTourDepartureEndDate(
      selectedDate.startDate,
      selectedDate.endDate,
      durationDays
    );
    const keys = new Set(
      eachTourDepartureDateKey(selectedDate.startDate, selectedDate.endDate, durationDays)
    );
    return {
      startKey: selectedDate.startDate,
      endKey,
      keys,
      isSingleDay: keys.size <= 1,
    };
  }, [selectedDate, durationDays]);

  const initialMonth = useMemo(() => {
    const parsed = selectedDate?.startDate ? parseStartDate(selectedDate.startDate) : null;
    return startOfMonth(parsed ?? new Date());
  }, [selectedDate?.startDate]);

  const [viewMonth, setViewMonth] = useState(initialMonth);

  useEffect(() => {
    setViewMonth(initialMonth);
  }, [initialMonth]);

  const monthDays = eachDayOfInterval({
    start: startOfMonth(viewMonth),
    end: endOfMonth(viewMonth),
  });
  const startPad = (startOfMonth(viewMonth).getDay() + 6) % 7;

  const tourDays = selectedDate
    ? countTourDepartureDays(selectedDate.startDate, selectedDate.endDate, durationDays)
    : 0;
  const tourNights = selectedDate
    ? countTourDepartureNights(selectedDate.startDate, selectedDate.endDate, durationDays)
    : 0;
  const selectedBookable = selectedDate
    ? dateFitsGuestCount(selectedDate, guests, groupMin)
    : false;

  return (
    <div className={cn("rounded-2xl border border-gray-200 bg-white p-3 sm:p-4", className)}>
      <div
        className={cn(
          showSidebar && "grid gap-4 lg:grid-cols-[minmax(0,15.5rem)_minmax(0,1fr)] lg:items-start"
        )}
      >
        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setViewMonth((current) => subMonths(current, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-slate transition-colors hover:border-sky/30 hover:text-charcoal"
              aria-label="Предыдущий месяц"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <p className="text-xs font-semibold capitalize text-charcoal sm:text-sm">
              {format(viewMonth, "LLLL yyyy", { locale: ru })}
            </p>
            <button
              type="button"
              onClick={() => setViewMonth((current) => addMonths(current, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-slate transition-colors hover:border-sky/30 hover:text-charcoal"
              aria-label="Следующий месяц"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-[10px] font-medium text-slate">
            {WEEKDAYS.map((day) => (
              <span key={day} className="py-0.5">
                {day}
              </span>
            ))}
          </div>

          <div className="mt-0.5 grid grid-cols-7">
            {Array.from({ length: startPad }).map((_, index) => (
              <div key={`pad-${index}`} className="h-9" />
            ))}
            {monthDays.map((day, dayIndex) => {
              const key = format(day, "yyyy-MM-dd");
              const columnIndex = (startPad + dayIndex) % 7;
              const entry = departureMap.get(key);
              const selected = entry?.date.id === selectedDateId;
              const bookable = entry ? dateFitsGuestCount(entry.date, guests, groupMin) : false;
              const inSelectedRange = selectedRange?.keys.has(key) ?? false;
              const isRangeStart = selectedRange?.startKey === key;
              const isRangeEnd = selectedRange?.endKey === key;
              const isSingleDay = selectedRange?.isSingleDay ?? false;
              const barCaps = getRangeBarCaps(
                inSelectedRange,
                isRangeStart,
                isRangeEnd,
                columnIndex,
                isSingleDay
              );

              return (
                <div key={key} className="relative h-9 w-full px-px">
                  {barCaps ? (
                    <div
                      className={cn(
                        "pointer-events-none absolute top-1/2 h-7 -translate-y-1/2 bg-sky/20",
                        barCaps.roundLeft ? "left-1 rounded-l-full" : "-left-0.5",
                        barCaps.roundRight ? "right-1 rounded-r-full" : "-right-0.5",
                        isRangeEnd && !isSingleDay && "bg-sky/30"
                      )}
                      aria-hidden
                    />
                  ) : null}

                  {entry ? (
                    <button
                      type="button"
                      onClick={() => onSelect(entry.date)}
                      aria-label={`Заезд ${format(day, "d MMMM", { locale: ru })}`}
                      aria-pressed={selected}
                      className={cn(
                        "relative z-10 flex h-9 w-full flex-col items-center justify-center px-0.5 py-0.5 text-center transition-colors",
                        selected
                          ? isSingleDay
                            ? "rounded-full bg-sky text-white shadow-sm"
                            : isRangeStart
                              ? "rounded-l-full rounded-r-md bg-sky text-white shadow-sm"
                              : "rounded-md border border-sky/25 bg-sky/5 text-charcoal hover:border-sky/40 hover:bg-sky/10"
                          : bookable
                            ? "rounded-md border border-sky/25 bg-white/90 text-charcoal hover:border-sky/40 hover:bg-sky/10"
                            : "rounded-md border border-amber-200/80 bg-amber-50/90 text-amber-950 hover:border-amber-300"
                      )}
                    >
                      <span className="text-[11px] font-semibold leading-none">
                        {format(day, "d")}
                      </span>
                      {!priceOnRequest && entry.date.priceUsd > 0 ? (
                        <span
                          className={cn(
                            "mt-0.5 max-w-full truncate text-[8px] font-semibold leading-none",
                            selected && isRangeStart
                              ? "text-white/95"
                              : bookable
                                ? "text-sky-dark"
                                : "text-amber-800"
                          )}
                        >
                          {formatCompactUsd(entry.date.priceUsd)}
                        </span>
                      ) : null}
                    </button>
                  ) : inSelectedRange ? (
                    <span
                      className={cn(
                        "relative z-10 flex h-9 w-full items-center justify-center text-[11px] font-semibold text-sky-dark",
                        isRangeEnd && !isSingleDay && "text-sky"
                      )}
                      aria-hidden
                    >
                      {format(day, "d")}
                    </span>
                  ) : (
                    <span
                      className="relative z-10 flex h-9 w-full items-center justify-center text-[11px] text-gray-300"
                      aria-hidden
                    >
                      {format(day, "d")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {showSidebar ? (
          <aside className="rounded-xl border border-gray-100 bg-gradient-to-br from-sky/[0.04] to-white p-3.5 sm:p-4">
            {selectedDate ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate">
                    Выбранный заезд
                  </p>
                  <p className="mt-1.5 text-sm font-semibold text-charcoal">
                    {formatDateRange(selectedDate.startDate, selectedDate.endDate)}
                  </p>
                </div>

                <dl className="grid gap-2.5 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate">Начало</dt>
                    <dd className="text-right font-medium text-charcoal">
                      {format(parseISO(selectedDate.startDate), "d MMM yyyy", { locale: ru })}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate">Окончание</dt>
                    <dd className="text-right font-medium text-charcoal">
                      {format(
                        parseISO(
                          resolveTourDepartureEndDate(
                            selectedDate.startDate,
                            selectedDate.endDate,
                            durationDays
                          )
                        ),
                        "d MMM yyyy",
                        { locale: ru }
                      )}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate">Длительность</dt>
                    <dd className="text-right font-medium text-charcoal">
                      {formatDays(tourDays)}
                      {tourNights > 0 ? ` · ${formatNights(tourNights)}` : null}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate">Мест</dt>
                    <dd
                      className={cn(
                        "text-right font-medium",
                        selectedBookable ? "text-emerald-700" : "text-wine"
                      )}
                    >
                      {formatSpots(selectedDate.spotsLeft)}
                    </dd>
                  </div>
                  {!priceOnRequest ? (
                    <div className="flex items-start justify-between gap-3">
                      <dt className="text-slate">Цена / чел.</dt>
                      <dd className="text-right font-semibold text-charcoal">
                        <FormattedPrice priceUsd={selectedDate.priceUsd} />
                      </dd>
                    </div>
                  ) : null}
                </dl>

                {!selectedBookable ? (
                  <p className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs leading-relaxed text-amber-950">
                    Для {formatForTourists(guests)} мест не хватает — можно встать в лист
                    ожидания или уменьшить группу.
                  </p>
                ) : null}

                <div className="border-t border-gray-100 pt-3">
                  <p className="mb-2 text-xs font-semibold text-charcoal">Обозначения</p>
                  <CalendarLegend />
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-slate">
                Выберите дату заезда в календаре — покажем, сколько длится тур и когда он
                заканчивается.
              </p>
            )}
          </aside>
        ) : null}
      </div>

      <p className="mt-3 text-[10px] leading-relaxed text-slate sm:text-[11px]">
        Активны только даты заезда от организатора. Подсветка показывает весь период тура: от
        начала до последнего дня программы.
      </p>
    </div>
  );
}
