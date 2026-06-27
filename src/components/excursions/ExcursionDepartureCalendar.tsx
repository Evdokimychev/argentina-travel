"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  buildExcursionCalendarDates,
  formatExcursionCalendarPrice,
  type ExcursionCalendarDate,
} from "@/lib/excursion-calendar";
import type { ExcursionScheduleDate } from "@/lib/excursion-schedule";
import { cn } from "@/lib/cn";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

type ExcursionDepartureCalendarProps = {
  scheduleDates: ExcursionScheduleDate[];
  selectedDate: string;
  onSelect: (date: string) => void;
  loading?: boolean;
  className?: string;
  hideHeading?: boolean;
};

function resolveInitialMonth(dates: ExcursionCalendarDate[], selectedDate: string): Date {
  if (selectedDate) {
    return startOfMonth(parseISO(`${selectedDate}T12:00:00`));
  }
  if (dates[0]?.date) {
    return startOfMonth(parseISO(`${dates[0].date}T12:00:00`));
  }
  return startOfMonth(new Date());
}

function MonthGrid({
  month,
  dateMap,
  selectedDate,
  onSelect,
}: {
  month: Date;
  dateMap: Map<string, ExcursionCalendarDate>;
  selectedDate: string;
  onSelect: (date: string) => void;
}) {
  const monthDays = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  });
  const startPad = (startOfMonth(month).getDay() + 6) % 7;

  return (
    <div className="min-w-0">
      <p className="mb-2 text-center text-xs font-semibold capitalize text-charcoal">
        {format(month, "LLLL yyyy", { locale: ru })}
      </p>

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
        {monthDays.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const entry = dateMap.get(key);
          const selected = selectedDate === key;
          const priceLabel = entry ? formatExcursionCalendarPrice(entry) : null;

          return (
            <div key={key} className="h-9 w-full px-px">
              {entry ? (
                <button
                  type="button"
                  onClick={() => onSelect(key)}
                  aria-label={`Дата ${format(day, "d MMMM", { locale: ru })}`}
                  aria-pressed={selected}
                  className={cn(
                    "flex h-9 w-full flex-col items-center justify-center rounded-md px-0.5 py-0.5 text-center transition-colors",
                    selected
                      ? "bg-sky text-white shadow-sm"
                      : "border border-sky/20 bg-white text-charcoal hover:border-sky/40 hover:bg-sky/10"
                  )}
                >
                  <span className="text-[11px] font-semibold leading-none">{format(day, "d")}</span>
                  {priceLabel ? (
                    <span
                      className={cn(
                        "mt-0.5 max-w-full truncate text-[8px] font-semibold leading-none",
                        selected ? "text-white/95" : "text-sky-dark"
                      )}
                    >
                      {priceLabel}
                    </span>
                  ) : null}
                </button>
              ) : (
                <span
                  className="flex h-9 w-full items-center justify-center text-[11px] text-gray-300"
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
  );
}

export default function ExcursionDepartureCalendar({
  scheduleDates,
  selectedDate,
  onSelect,
  loading = false,
  className,
  hideHeading = false,
}: ExcursionDepartureCalendarProps) {
  const calendarDates = useMemo(
    () => buildExcursionCalendarDates(scheduleDates),
    [scheduleDates]
  );
  const dateMap = useMemo(
    () => new Map(calendarDates.map((entry) => [entry.date, entry])),
    [calendarDates]
  );

  const [viewMonth, setViewMonth] = useState(() =>
    resolveInitialMonth(calendarDates, selectedDate)
  );

  useEffect(() => {
    setViewMonth(resolveInitialMonth(calendarDates, selectedDate));
  }, [calendarDates, selectedDate]);

  const secondMonth = addMonths(viewMonth, 1);
  const canPrev = calendarDates.some((entry) =>
    isSameMonth(parseISO(`${entry.date}T12:00:00`), subMonths(viewMonth, 1))
  );
  const canNext = calendarDates.some((entry) =>
    isSameMonth(parseISO(`${entry.date}T12:00:00`), addMonths(secondMonth, 1))
  );

  if (loading && scheduleDates.length === 0) {
    return (
      <div className={cn("space-y-2", className)}>
        {!hideHeading ? <p className="text-sm font-medium text-charcoal">Доступные даты</p> : null}
        <div className="grid gap-6 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-6">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-52 animate-pulse rounded-xl border border-gray-100 bg-gray-50"
            />
          ))}
        </div>
      </div>
    );
  }

  if (scheduleDates.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className={cn("flex items-center gap-2", hideHeading ? "justify-end" : "justify-between")}>
        {!hideHeading ? <p className="text-sm font-medium text-charcoal">Доступные даты</p> : null}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => setViewMonth((current) => subMonths(current, 1))}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-slate transition-colors hover:border-sky/30 hover:text-charcoal disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Предыдущие месяцы"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setViewMonth((current) => addMonths(current, 1))}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-slate transition-colors hover:border-sky/30 hover:text-charcoal disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Следующие месяцы"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-3">
        <div className="grid gap-6 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-6">
          <MonthGrid
            month={viewMonth}
            dateMap={dateMap}
            selectedDate={selectedDate}
            onSelect={onSelect}
          />
          <MonthGrid
            month={secondMonth}
            dateMap={dateMap}
            selectedDate={selectedDate}
            onSelect={onSelect}
          />
        </div>
      </div>
    </div>
  );
}
