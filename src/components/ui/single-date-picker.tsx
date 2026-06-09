"use client";

import { useMemo, useState } from "react";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
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
import CalendarMonthGrid, { isDayDisabled } from "@/components/ui/calendar-month-grid";
import { cn } from "@/lib/cn";

interface SingleDatePickerProps {
  id?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  min?: string;
  max?: string;
  /** Блокировать даты раньше сегодня (для заездов). Для даты рождения — false. */
  disablePast?: boolean;
  /** Удобный выбор месяца и года — для даты рождения */
  birthDatePicker?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => ({
  value: index,
  label: format(new Date(2020, index, 1), "LLLL", { locale: ru }),
}));

function parseBound(value?: string): Date | null {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? startOfDay(parsed) : null;
}

function clampViewMonth(date: Date, minDate: Date | null, maxDate: Date | null): Date {
  let target = startOfMonth(date);
  if (minDate && isBefore(target, startOfMonth(minDate))) {
    target = startOfMonth(minDate);
  }
  if (maxDate && isAfter(target, startOfMonth(maxDate))) {
    target = startOfMonth(maxDate);
  }
  return target;
}

function getBirthDateDefaultMonth(maxDate: Date | null): Date {
  const ref = maxDate ?? new Date();
  const approx = new Date(ref);
  approx.setFullYear(approx.getFullYear() - 35);
  return startOfMonth(approx);
}

function getDisplayMonth(
  value: Date | null,
  minDate: Date | null,
  maxDate: Date | null,
  birthDatePicker: boolean
): Date {
  if (value) {
    return clampViewMonth(value, minDate, maxDate);
  }
  if (birthDatePicker) {
    return clampViewMonth(getBirthDateDefaultMonth(maxDate), minDate, maxDate);
  }
  return clampViewMonth(new Date(), minDate, maxDate);
}

function buildYearOptions(minDate: Date | null, maxDate: Date | null): number[] {
  const maxYear = maxDate?.getFullYear() ?? new Date().getFullYear();
  const minYear = minDate?.getFullYear() ?? maxYear - 120;
  return Array.from({ length: maxYear - minYear + 1 }, (_, index) => maxYear - index);
}

function isMonthOptionDisabled(
  year: number,
  monthIndex: number,
  minDate: Date | null,
  maxDate: Date | null
): boolean {
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 0);
  if (minDate && isBefore(startOfDay(monthEnd), startOfDay(minDate))) return true;
  if (maxDate && isAfter(startOfDay(monthStart), startOfDay(maxDate))) return true;
  return false;
}

function mergeDateWithMonthYear(
  current: Date,
  nextMonth: number,
  nextYear: number,
  minDate: Date | null,
  maxDate: Date | null,
  disablePast: boolean
): Date {
  const daysInMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
  const day = Math.min(current.getDate(), daysInMonth);

  for (let candidateDay = day; candidateDay >= 1; candidateDay -= 1) {
    const candidate = startOfDay(new Date(nextYear, nextMonth, candidateDay));
    if (!isDayDisabled(candidate, minDate, maxDate, disablePast)) {
      return candidate;
    }
  }

  return startOfDay(current);
}

function BirthDateMonthYearControls({
  month,
  selectedDate,
  minDate,
  maxDate,
  disablePast,
  idPrefix,
  onViewMonthChange,
  onSelectedDateChange,
}: {
  month: Date;
  selectedDate: Date | null;
  minDate: Date | null;
  maxDate: Date | null;
  disablePast: boolean;
  idPrefix?: string;
  onViewMonthChange: (next: Date) => void;
  onSelectedDateChange: (next: Date) => void;
}) {
  const years = useMemo(() => buildYearOptions(minDate, maxDate), [minDate, maxDate]);
  const currentYear = month.getFullYear();
  const currentMonth = month.getMonth();
  const monthSelectId = `${idPrefix ?? "birth-date"}-month`;
  const yearSelectId = `${idPrefix ?? "birth-date"}-year`;

  function updateMonthYear(nextMonth: number, nextYear: number) {
    const viewMonth = clampViewMonth(new Date(nextYear, nextMonth, 1), minDate, maxDate);

    if (selectedDate) {
      onSelectedDateChange(
        mergeDateWithMonthYear(
          selectedDate,
          viewMonth.getMonth(),
          viewMonth.getFullYear(),
          minDate,
          maxDate,
          disablePast
        )
      );
      return;
    }

    onViewMonthChange(viewMonth);
  }

  return (
    <div className="flex gap-2 border-b border-gray-100 px-3 py-2.5">
      <div className="relative min-w-0 flex-1">
        <label htmlFor={monthSelectId} className="sr-only">
          Месяц
        </label>
        <select
          id={monthSelectId}
          value={currentMonth}
          onChange={(e) => updateMonthYear(Number(e.target.value), currentYear)}
          className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm capitalize text-charcoal focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        >
          {MONTH_OPTIONS.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={isMonthOptionDisabled(currentYear, option.value, minDate, maxDate)}
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
          aria-hidden
        />
      </div>
      <div className="relative w-[5.5rem] shrink-0">
        <label htmlFor={yearSelectId} className="sr-only">
          Год
        </label>
        <select
          id={yearSelectId}
          value={currentYear}
          onChange={(e) => updateMonthYear(currentMonth, Number(e.target.value))}
          className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm tabular-nums text-charcoal focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
          aria-hidden
        />
      </div>
    </div>
  );
}

export default function SingleDatePicker({
  id,
  value,
  onChange,
  min,
  max,
  disablePast = false,
  birthDatePicker = false,
  placeholder = "Выберите дату",
  className,
  disabled = false,
}: SingleDatePickerProps) {
  const [open, setOpen] = useState(false);
  const minDate = useMemo(() => parseBound(min), [min]);
  const maxDate = useMemo(() => parseBound(max), [max]);
  const [month, setMonth] = useState(() =>
    getDisplayMonth(value, minDate, maxDate, birthDatePicker)
  );

  const label = value
    ? birthDatePicker
      ? format(value, "dd.MM.yyyy")
      : format(value, "d MMMM yyyy", { locale: ru })
    : placeholder;

  function handleSelect(day: Date) {
    onChange(day);
    setMonth(clampViewMonth(day, minDate, maxDate));
    setOpen(false);
  }

  function syncMonth(next: Date) {
    setMonth(clampViewMonth(next, minDate, maxDate));
  }

  function handleBirthDateMonthYearChange(next: Date) {
    onChange(next);
    setMonth(clampViewMonth(next, minDate, maxDate));
  }

  return (
    <Popover
      open={disabled ? false : open}
      onOpenChange={(next) => {
        if (disabled) return;
        setOpen(next);
        if (next) {
          setMonth(getDisplayMonth(value, minDate, maxDate, birthDatePicker));
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={cn(
            "flex h-11 w-full items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 text-left text-sm transition-[border-color,box-shadow,background-color]",
            "hover:border-gray-300",
            "focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20",
            open && "border-brand ring-2 ring-brand/20",
            disabled && "cursor-not-allowed opacity-60 hover:border-gray-200",
            className
          )}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/10">
            <Calendar className="h-4 w-4 text-brand" aria-hidden />
          </span>
          <span className={cn("min-w-0 flex-1 truncate", value ? "text-charcoal" : "text-gray-400")}>
            {label}
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
      <PopoverContent className="w-[280px] min-w-[280px] p-0" align="start" sideOffset={6}>
        {birthDatePicker ? (
          <>
            <BirthDateMonthYearControls
              month={month}
              selectedDate={value}
              minDate={minDate}
              maxDate={maxDate}
              disablePast={disablePast}
              idPrefix={id}
              onViewMonthChange={syncMonth}
              onSelectedDateChange={handleBirthDateMonthYearChange}
            />
            <div className="py-2">
              <CalendarMonthGrid
                month={month}
                selected={value}
                minDate={minDate}
                maxDate={maxDate}
                disablePast={disablePast}
                hideTitle
                onDayClick={handleSelect}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center border-b border-gray-100 py-2">
            <button
              type="button"
              onClick={() => syncMonth(subMonths(month, 1))}
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
                disablePast={disablePast}
                onDayClick={handleSelect}
              />
            </div>
            <button
              type="button"
              onClick={() => syncMonth(addMonths(month, 1))}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-gray-100"
              aria-label="Следующий месяц"
            >
              <ChevronRight className="h-5 w-5 text-charcoal" />
            </button>
          </div>
        )}
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
