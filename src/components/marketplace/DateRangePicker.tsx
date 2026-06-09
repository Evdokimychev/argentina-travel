"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isWithinInterval,
  isBefore,
  startOfDay,
} from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { DATE_PRESETS } from "@/data/filters";

interface DateRangePickerProps {
  from: Date | null;
  to: Date | null;
  onChange: (from: Date | null, to: Date | null) => void;
  onApply: () => void;
  onClear: () => void;
}

function getPresetRange(id: string): { from: Date; to: Date } | null {
  const year = new Date().getFullYear();
  switch (id) {
    case "weekend": {
      const now = new Date();
      const day = now.getDay();
      const sat = new Date(now);
      sat.setDate(now.getDate() + ((6 - day + 7) % 7 || 7));
      const sun = new Date(sat);
      sun.setDate(sat.getDate() + 1);
      return { from: sat, to: sun };
    }
    case "july":
      return { from: new Date(year, 6, 1), to: new Date(year, 6, 31) };
    case "august":
      return { from: new Date(year, 7, 1), to: new Date(year, 7, 31) };
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

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

interface MonthGridProps {
  month: Date;
  from: Date | null;
  to: Date | null;
  onDayClick: (day: Date) => void;
}

function MonthGrid({ month, from, to, onDayClick }: MonthGridProps) {
  const days = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  });
  const startPad = (startOfMonth(month).getDay() + 6) % 7;

  function isInRange(day: Date) {
    if (!from || !to) return false;
    return isWithinInterval(day, { start: from, end: to });
  }

  return (
    <div className="w-[252px] shrink-0 px-3">
      <p className="mb-3 text-center text-sm font-semibold capitalize text-charcoal">
        {format(month, "LLLL yyyy", { locale: ru })}
      </p>
      <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-medium text-slate">
        {WEEKDAYS.map((d) => (
          <span key={d} className="py-1">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} className="h-8" />
        ))}
        {days.map((day) => {
          const selected =
            (from && isSameDay(day, from)) || (to && isSameDay(day, to));
          const inRange = isInRange(day);
          const past = isBefore(day, startOfDay(new Date()));
          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={past}
              onClick={() => onDayClick(day)}
              className={cn(
                "mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors",
                selected && "bg-brand text-white",
                inRange && !selected && "bg-brand-light text-brand",
                !selected && !inRange && !past && "hover:bg-gray-100",
                past && "cursor-not-allowed text-gray-300"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
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
    if (!from || (from && to)) {
      onChange(day, null);
    } else if (isBefore(day, from)) {
      onChange(day, from);
    } else {
      onChange(from, day);
    }
  }

  return (
    <div className="w-[580px] max-w-[calc(100vw-2rem)]">
      <div className="flex items-center border-b border-gray-100 py-2">
        <button
          type="button"
          onClick={() => setMonth(subMonths(month, 1))}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-gray-100"
          aria-label="Предыдущий месяц"
        >
          <ChevronLeft className="h-5 w-5 text-charcoal" />
        </button>

        <div className="flex flex-1 divide-x divide-gray-100">
          <MonthGrid month={month} from={from} to={to} onDayClick={handleDayClick} />
          <MonthGrid
            month={secondMonth}
            from={from}
            to={to}
            onDayClick={handleDayClick}
          />
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

      <div className="flex flex-wrap gap-1.5 px-4 py-3">
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
