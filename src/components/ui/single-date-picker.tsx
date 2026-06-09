"use client";

import { useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  subMonths,
  format,
  parseISO,
  isValid,
  startOfDay,
  startOfMonth,
  isBefore,
  isAfter,
} from "date-fns";
import { ru } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import CalendarMonthGrid from "@/components/ui/calendar-month-grid";
import { cn } from "@/lib/cn";

interface SingleDatePickerProps {
  id?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  className?: string;
}

function parseBound(value?: string): Date | null {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? startOfDay(parsed) : null;
}

function getDisplayMonth(
  value: Date | null,
  minDate: Date | null,
  maxDate: Date | null
): Date {
  let target = startOfMonth(value ?? new Date());

  if (minDate && isBefore(target, startOfMonth(minDate))) {
    target = startOfMonth(minDate);
  }
  if (maxDate && isAfter(target, startOfMonth(maxDate))) {
    target = startOfMonth(maxDate);
  }

  return target;
}

export default function SingleDatePicker({
  id,
  value,
  onChange,
  min,
  max,
  placeholder = "Выберите дату",
  className,
}: SingleDatePickerProps) {
  const [open, setOpen] = useState(false);
  const minDate = useMemo(() => parseBound(min), [min]);
  const maxDate = useMemo(() => parseBound(max), [max]);
  const [month, setMonth] = useState(() => getDisplayMonth(value, minDate, maxDate));

  const label = value
    ? format(value, "d MMMM yyyy", { locale: ru })
    : placeholder;

  function handleSelect(day: Date) {
    onChange(day);
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setMonth(getDisplayMonth(value, minDate, maxDate));
      }}
    >
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          className={cn(
            "mt-1.5 flex w-full items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 text-left text-sm transition-colors hover:bg-gray-100/80 focus:outline-none focus:ring-2 focus:ring-sky/20",
            className
          )}
        >
          <Calendar className="h-4 w-4 shrink-0 text-brand" aria-hidden />
          <span className={cn("min-w-0 flex-1 truncate", value ? "text-charcoal" : "text-gray-400")}>
            {label}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] min-w-[280px] p-0" align="start" sideOffset={6}>
        <div className="flex items-center border-b border-gray-100 py-2">
          <button
            type="button"
            onClick={() => setMonth(subMonths(month, 1))}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-gray-100"
            aria-label="Предыдущий месяц"
          >
            <ChevronLeft className="h-5 w-5 text-charcoal" />
          </button>
          <div className="flex-1 py-1">
            <CalendarMonthGrid
              month={month}
              selected={value}
              minDate={minDate}
              maxDate={maxDate}
              disablePast
              onDayClick={handleSelect}
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
        {value && (
          <div className="border-t border-gray-100 p-2">
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="w-full rounded-lg py-2 text-sm font-medium text-slate transition-colors hover:bg-gray-50 hover:text-charcoal"
            >
              Очистить
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
