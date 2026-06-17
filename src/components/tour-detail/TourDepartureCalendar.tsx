"use client";

import { useMemo, useState } from "react";
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
import { cn } from "@/lib/cn";
import { buildDepartureCalendarMap, formatCompactUsd } from "@/lib/tour-date-pricing";
import { dateFitsGuestCount } from "@/lib/tour-booking-spots";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

interface TourDepartureCalendarProps {
  dates: TourDatePrice[];
  selectedDateId: string;
  onSelect: (date: TourDatePrice) => void;
  guests: number;
  groupMin: number;
  className?: string;
}

function parseStartDate(value: string): Date | null {
  const parsed = parseISO(value);
  return isValid(parsed) ? startOfDay(parsed) : null;
}

export default function TourDepartureCalendar({
  dates,
  selectedDateId,
  onSelect,
  guests,
  groupMin,
  className,
}: TourDepartureCalendarProps) {
  const departureMap = useMemo(() => buildDepartureCalendarMap(dates), [dates]);

  const initialMonth = useMemo(() => {
    const selected = dates.find((item) => item.id === selectedDateId);
    const first = selected ?? dates[0];
    const parsed = first?.startDate ? parseStartDate(first.startDate) : null;
    return startOfMonth(parsed ?? new Date());
  }, [dates, selectedDateId]);

  const [viewMonth, setViewMonth] = useState(initialMonth);

  const monthDays = eachDayOfInterval({
    start: startOfMonth(viewMonth),
    end: endOfMonth(viewMonth),
  });
  const startPad = (startOfMonth(viewMonth).getDay() + 6) % 7;

  return (
    <div className={cn("rounded-2xl border border-gray-200 bg-white p-4", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setViewMonth((current) => subMonths(current, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-slate transition-colors hover:border-brand/30 hover:text-charcoal"
          aria-label="Предыдущий месяц"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold capitalize text-charcoal">
          {format(viewMonth, "LLLL yyyy", { locale: ru })}
        </p>
        <button
          type="button"
          onClick={() => setViewMonth((current) => addMonths(current, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-slate transition-colors hover:border-brand/30 hover:text-charcoal"
          aria-label="Следующий месяц"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-medium text-slate">
        {WEEKDAYS.map((day) => (
          <span key={day} className="py-1">
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: startPad }).map((_, index) => (
          <div key={`pad-${index}`} className="h-[52px]" />
        ))}
        {monthDays.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const entry = departureMap.get(key);
          const selected = entry?.date.id === selectedDateId;
          const bookable = entry
            ? dateFitsGuestCount(entry.date, guests, groupMin)
            : false;

          return (
            <div key={key} className="flex justify-center px-0.5">
              {entry ? (
                <button
                  type="button"
                  onClick={() => onSelect(entry.date)}
                  className={cn(
                    "flex min-h-[52px] w-full max-w-[52px] flex-col items-center justify-center rounded-xl border px-0.5 py-1 text-center transition-colors",
                    selected
                      ? "border-sky bg-sky text-white shadow-sm"
                      : bookable
                        ? "border-sky/20 bg-sky/5 text-charcoal hover:border-sky/40 hover:bg-sky/10"
                        : "border-amber-200/80 bg-amber-50/80 text-amber-950 hover:border-amber-300"
                  )}
                >
                  <span className="text-sm font-semibold leading-none">{format(day, "d")}</span>
                  <span
                    className={cn(
                      "mt-1 max-w-full truncate text-[9px] font-semibold leading-none",
                      selected ? "text-white/95" : bookable ? "text-sky-dark" : "text-amber-800"
                    )}
                  >
                    {formatCompactUsd(entry.date.priceUsd)}
                  </span>
                </button>
              ) : (
                <span
                  className="flex min-h-[52px] w-full max-w-[52px] flex-col items-center justify-center rounded-xl text-sm text-gray-300"
                  aria-hidden
                >
                  {format(day, "d")}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-slate">
        Выбрать можно только даты заезда, которые указал организатор. На каждой дате — стоимость за
        одного туриста.
      </p>
    </div>
  );
}
