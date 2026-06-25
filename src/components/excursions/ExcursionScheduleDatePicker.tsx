"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { format, isSameMonth, parseISO, startOfMonth } from "date-fns";
import { ru } from "date-fns/locale";
import CalendarMonthGrid from "@/components/ui/calendar-month-grid";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/cn";

const RU_WEEKDAY_2: Record<number, string> = {
  0: "вс",
  1: "пн",
  2: "вт",
  3: "ср",
  4: "чт",
  5: "пт",
  6: "сб",
};

export function formatExcursionScheduleDayLabel(dateStr: string, locale: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  const dayMonth = format(date, "d MMM", {
    locale: locale.startsWith("ru") ? ru : undefined,
  }).replace(/\.$/, "");

  if (locale.startsWith("ru")) {
    return `${dayMonth}, ${RU_WEEKDAY_2[date.getDay()]}`;
  }

  return format(date, "d MMM, EE");
}

type ExcursionScheduleDatePickerProps = {
  dates: string[];
  selectedDate: string;
  onSelect: (date: string) => void;
  locale: string;
  label?: string;
  placeholder?: string;
  className?: string;
};

function resolveViewMonth(selectedDate: string, months: Date[]): Date {
  if (selectedDate) {
    const selectedMonth = startOfMonth(new Date(`${selectedDate}T12:00:00`));
    const match = months.find((month) => isSameMonth(month, selectedMonth));
    if (match) return match;
  }
  return months[0] ?? startOfMonth(new Date());
}

export default function ExcursionScheduleDatePicker({
  dates,
  selectedDate,
  onSelect,
  locale,
  label,
  placeholder = "Выберите дату",
  className,
}: ExcursionScheduleDatePickerProps) {
  const [open, setOpen] = useState(false);
  const availableSet = useMemo(() => new Set(dates), [dates]);

  const months = useMemo(() => {
    const unique = [...new Set(dates.map((entry) => entry.slice(0, 7)))].sort();
    return unique.map((monthKey) => startOfMonth(parseISO(`${monthKey}-01`)));
  }, [dates]);

  const [viewMonth, setViewMonth] = useState(() => resolveViewMonth(selectedDate, months));

  useEffect(() => {
    setViewMonth(resolveViewMonth(selectedDate, months));
  }, [selectedDate, months]);

  const monthIndex = months.findIndex((month) => isSameMonth(month, viewMonth));
  const resolvedIndex = monthIndex >= 0 ? monthIndex : 0;
  const canPrev = resolvedIndex > 0;
  const canNext = resolvedIndex < months.length - 1;

  const selectedValue = selectedDate ? new Date(`${selectedDate}T12:00:00`) : null;
  const monthLocale = locale.startsWith("ru") ? ru : undefined;
  const displayLabel = selectedDate
    ? formatExcursionScheduleDayLabel(selectedDate, locale)
    : placeholder;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setViewMonth(resolveViewMonth(selectedDate, months));
    }
  }

  function handleSelect(day: Date) {
    onSelect(format(day, "yyyy-MM-dd"));
    setOpen(false);
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <label className="text-sm font-medium text-charcoal">{label}</label>
      ) : null}

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            className={cn(
              "flex h-11 w-full items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 text-left text-sm transition-[border-color,box-shadow,background-color]",
              "hover:border-gray-300",
              "focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/20",
              open && "border-sky ring-2 ring-sky/20"
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky/10">
              <Calendar className="h-4 w-4 text-sky" aria-hidden />
            </span>
            <span
              className={cn(
                "min-w-0 flex-1 truncate",
                selectedDate ? "text-charcoal" : "text-slate/70"
              )}
            >
              {displayLabel}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-slate transition-transform",
                open && "rotate-180"
              )}
              aria-hidden
            />
          </button>
        </PopoverTrigger>

        <PopoverContent className="p-0 sm:w-[280px] sm:min-w-[280px]" align="start" sideOffset={6}>
          <div className="border-b border-gray-100 px-2 py-2">
            <div className="mb-1 flex items-center justify-between gap-1">
              <button
                type="button"
                disabled={!canPrev}
                onClick={() => setViewMonth(months[resolvedIndex - 1]!)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-charcoal transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Предыдущий месяц"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>

              <p className="min-w-0 truncate text-center text-sm font-semibold capitalize text-charcoal">
                {format(viewMonth, "LLLL yyyy", { locale: monthLocale })}
              </p>

              <button
                type="button"
                disabled={!canNext}
                onClick={() => setViewMonth(months[resolvedIndex + 1]!)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-charcoal transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Следующий месяц"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <CalendarMonthGrid
              month={viewMonth}
              selected={selectedValue}
              hideTitle
              isDateSelectable={(day) => availableSet.has(format(day, "yyyy-MM-dd"))}
              onDayClick={handleSelect}
              className="px-0"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
