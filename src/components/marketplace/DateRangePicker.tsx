"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, addMonths, isBefore, isSameDay, startOfDay, startOfMonth, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import CalendarMonthGrid from "@/components/ui/calendar-month-grid";
import { DATE_PRESETS } from "@/data/filters";

interface DateRangePickerProps {
  from: Date | null;
  to: Date | null;
  onChange: (from: Date | null, to: Date | null) => void;
  onApply: () => void;
  onClear: () => void;
}

function resolvePresetYear(monthIndex: number): number {
  const now = startOfDay(new Date());
  const year = now.getFullYear();
  const monthStart = startOfMonth(new Date(year, monthIndex, 1));
  return monthStart < startOfMonth(now) ? year + 1 : year;
}

function getPresetRange(id: string): { from: Date; to: Date } | null {
  const year = new Date().getFullYear();
  switch (id) {
    case "weekend": {
      const now = startOfDay(new Date());
      const day = now.getDay();
      if (day === 6) return { from: now, to: addDays(now, 1) };
      if (day === 0) return { from: addDays(now, -1), to: now };
      const daysUntilSat = (6 - day + 7) % 7;
      const sat = addDays(now, daysUntilSat);
      return { from: sat, to: addDays(sat, 1) };
    }
    case "july": {
      const presetYear = resolvePresetYear(6);
      return { from: new Date(presetYear, 6, 1), to: new Date(presetYear, 6, 31) };
    }
    case "august": {
      const presetYear = resolvePresetYear(7);
      return { from: new Date(presetYear, 7, 1), to: new Date(presetYear, 7, 31) };
    }
    case "spring":
      return { from: new Date(year, 8, 1), to: new Date(year, 10, 30) };
    case "summer":
      return { from: new Date(year, 11, 1), to: new Date(year + 1, 2, 31) };
    case "patagonia-autumn":
      return { from: new Date(year, 2, 1), to: new Date(year, 4, 31) };
    case "andes-winter":
      return { from: new Date(year, 5, 1), to: new Date(year, 7, 31) };
    case "new-year":
      return { from: new Date(year, 11, 28), to: new Date(year + 1, 0, 5) };
    case "carnival":
      return { from: new Date(year, 1, 20), to: new Date(year, 2, 5) };
    default:
      return null;
  }
}

export default function DateRangePicker({
  from,
  to,
  onChange,
  onApply,
  onClear,
}: DateRangePickerProps) {
  const [month, setMonth] = useState(from ?? new Date());
  const secondMonth = addMonths(month, 1);

  function handleDayClick(day: Date) {
    const clicked = startOfDay(day);
    const rangeStart = from ? startOfDay(from) : null;

    if (!rangeStart || (rangeStart && to)) {
      onChange(clicked, null);
    } else if (isBefore(clicked, rangeStart)) {
      onChange(clicked, rangeStart);
    } else if (isSameDay(clicked, rangeStart)) {
      onChange(rangeStart, rangeStart);
    } else {
      onChange(rangeStart, clicked);
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-start border-b border-gray-100 px-1 py-2 sm:px-2">
        <button
          type="button"
          onClick={() => setMonth(subMonths(month, 1))}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-gray-100"
          aria-label="Предыдущий месяц"
        >
          <ChevronLeft className="h-5 w-5 text-charcoal" />
        </button>

        <div className="flex min-w-0 flex-1 items-start justify-center gap-2 md:gap-4 md:divide-x md:divide-gray-100">
          <CalendarMonthGrid
            month={month}
            rangeFrom={from}
            rangeTo={to}
            disablePast
            onDayClick={handleDayClick}
            className="w-full min-w-0 flex-1 px-1 sm:px-2 md:max-w-[15.75rem]"
          />
          <div className="hidden min-w-0 flex-1 md:block md:max-w-[15.75rem]">
            <CalendarMonthGrid
              month={secondMonth}
              rangeFrom={from}
              rangeTo={to}
              disablePast
              onDayClick={handleDayClick}
              className="w-full min-w-0 px-1 sm:px-2"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMonth(addMonths(month, 1))}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-gray-100"
          aria-label="Следующий месяц"
        >
          <ChevronRight className="h-5 w-5 text-charcoal" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 px-4 py-3.5 sm:px-5">
        {DATE_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              const range = getPresetRange(p.id);
              if (range) {
                onChange(range.from, range.to);
                setMonth(range.from);
              }
            }}
            className="rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium transition-colors hover:border-brand hover:text-brand"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 overflow-hidden rounded-b-2xl border-t border-gray-100">
        <Button variant="secondary" className="h-12 rounded-none" onClick={onClear}>
          Очистить
        </Button>
        <Button className="h-12 rounded-none" onClick={onApply}>
          Применить
        </Button>
      </div>
    </div>
  );
}
