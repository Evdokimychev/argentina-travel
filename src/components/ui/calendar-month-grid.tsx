"use client";

import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isSameDay,
  isBefore,
  isAfter,
  startOfDay,
} from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/cn";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

interface CalendarMonthGridProps {
  month: Date;
  selected?: Date | null;
  rangeFrom?: Date | null;
  rangeTo?: Date | null;
  minDate?: Date | null;
  maxDate?: Date | null;
  disablePast?: boolean;
  hideTitle?: boolean;
  onDayClick: (day: Date) => void;
  className?: string;
}

function isInRange(day: Date, from: Date | null | undefined, to: Date | null | undefined) {
  if (!from || !to) return false;
  const start = isBefore(from, to) ? from : to;
  const end = isAfter(from, to) ? from : to;
  return !isBefore(day, start) && !isAfter(day, end);
}

function isDayDisabled(
  day: Date,
  minDate?: Date | null,
  maxDate?: Date | null,
  disablePast?: boolean
) {
  if (disablePast && isBefore(day, startOfDay(new Date()))) return true;
  if (minDate && isBefore(day, startOfDay(minDate))) return true;
  if (maxDate && isAfter(day, startOfDay(maxDate))) return true;
  return false;
}

export default function CalendarMonthGrid({
  month,
  selected,
  rangeFrom,
  rangeTo,
  minDate,
  maxDate,
  disablePast = false,
  hideTitle = false,
  onDayClick,
  className,
}: CalendarMonthGridProps) {
  const days = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  });
  const startPad = (startOfMonth(month).getDay() + 6) % 7;

  return (
    <div className={cn("px-2", className)}>
      {!hideTitle && (
        <p className="mb-3 text-center text-sm font-semibold capitalize text-charcoal">
          {format(month, "LLLL yyyy", { locale: ru })}
        </p>
      )}
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
          const isSelected = selected ? isSameDay(day, selected) : false;
          const inRange = isInRange(day, rangeFrom, rangeTo);
          const disabled = isDayDisabled(day, minDate, maxDate, disablePast);

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onDayClick(day)}
              className={cn(
                "mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors",
                isSelected && "bg-sky text-white",
                inRange && !isSelected && "bg-sky/10 text-sky-dark",
                !isSelected && !inRange && !disabled && "hover:bg-gray-100",
                disabled && "cursor-not-allowed text-gray-300"
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

export { isDayDisabled };
