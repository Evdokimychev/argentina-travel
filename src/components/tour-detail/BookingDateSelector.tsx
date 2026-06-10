"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { TourDetail } from "@/types";
import { formatDateRange } from "@/lib/utils";
import { spotsWord } from "@/lib/pluralize";
import { cn } from "@/lib/cn";
import SingleDatePicker from "@/components/ui/single-date-picker";
import {
  dateFitsGuestCount,
  dateOptionSuffix,
  findBookableDates,
  suggestBookableDatesMessage,
  validateGuestsForScheduledBooking,
  type BookingDateMode,
} from "@/lib/tour-booking-spots";
import { useTourBooking } from "./TourBookingContext";

interface BookingDateSelectorProps {
  tour: TourDetail;
  /** Уникальный префикс для id полей (панель / чекаут) */
  idPrefix?: string;
  className?: string;
  /** Свернуть выбор: показывать только текущие даты и кнопку «Изменить» */
  collapsible?: boolean;
}

function formatSelectionSummary(
  tour: TourDetail,
  dateMode: BookingDateMode,
  selectedDateId: string,
  customDate: Date | null,
  showModeToggle: boolean
): string {
  if (dateMode === "custom" && canPickCustom(tour.bookingMode ?? "scheduled")) {
    const datePart = customDate
      ? new Intl.DateTimeFormat("ru-RU", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(customDate)
      : null;
    return datePart ? `Индивидуально · ${datePart}` : "Индивидуально";
  }

  const selected = tour.dates.find((d) => d.id === selectedDateId);
  const datesPart = selected
    ? formatDateRange(selected.startDate, selected.endDate)
    : null;

  if (showModeToggle || (tour.bookingMode ?? "scheduled") === "scheduled") {
    return datesPart ? `Групповой тур · ${datesPart}` : "Групповой тур";
  }

  return datesPart ?? "Даты не выбраны";
}

export function canPickScheduled(mode: TourDetail["bookingMode"]): boolean {
  return mode === "scheduled" || mode === "both";
}

export function canPickCustom(mode: TourDetail["bookingMode"]): boolean {
  return mode === "on_request" || mode === "both";
}

export default function BookingDateSelector({
  tour,
  idPrefix = "booking",
  className,
  collapsible = false,
}: BookingDateSelectorProps) {
  const bookingMode = tour.bookingMode ?? "scheduled";
  const {
    selectedDateId,
    setSelectedDateId,
    dateMode,
    setDateMode,
    customDate,
    setCustomDate,
    guests,
  } = useTourBooking();

  const [expanded, setExpanded] = useState(!collapsible);
  const showModeToggle = bookingMode === "both";
  const showScheduledPicker = dateMode === "scheduled" && canPickScheduled(bookingMode);
  const showCustomPicker = dateMode === "custom" && canPickCustom(bookingMode);
  const selectId = `${idPrefix}-date-select`;
  const customDateId = `${idPrefix}-custom-date`;
  const selectionSummary = formatSelectionSummary(
    tour,
    dateMode,
    selectedDateId,
    customDate,
    showModeToggle
  );

  const scheduledError =
    showScheduledPicker && tour.dates.length > 0
      ? validateGuestsForScheduledBooking(tour, guests, selectedDateId)
      : null;
  const bookableAlternatives =
    scheduledError != null
      ? findBookableDates(tour.dates, guests, tour.groupMin)
      : [];
  const suggestion =
    scheduledError != null
      ? suggestBookableDatesMessage(tour.dates, guests, tour.groupMin)
      : null;

  useEffect(() => {
    if (collapsible && scheduledError) {
      setExpanded(true);
    }
  }, [collapsible, scheduledError]);

  return (
    <div className={cn("space-y-4", className)}>
      {collapsible && !expanded ? (
        <div className="space-y-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-charcoal">{selectionSummary}</p>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="shrink-0 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-charcoal transition-colors hover:border-brand hover:bg-gray-50 hover:text-brand"
            >
              Изменить
            </button>
          </div>
          {scheduledError && (
            <div className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-950">
              <p>{scheduledError}</p>
              {suggestion && <p className="mt-1 text-amber-900/90">{suggestion}</p>}
            </div>
          )}
        </div>
      ) : (
        <>
          {showModeToggle && (
            <div className="flex rounded-xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setDateMode("scheduled")}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                  dateMode === "scheduled"
                    ? "bg-white text-charcoal shadow-sm"
                    : "text-slate hover:text-charcoal"
                )}
              >
                Групповой тур
              </button>
              <button
                type="button"
                onClick={() => setDateMode("custom")}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                  dateMode === "custom"
                    ? "bg-white text-charcoal shadow-sm"
                    : "text-slate hover:text-charcoal"
                )}
              >
                Индивидуально
              </button>
            </div>
          )}

          {showScheduledPicker && tour.dates.length > 0 && (
            <div>
              <label htmlFor={selectId} className="text-sm font-medium text-charcoal">
                Даты путешествия
              </label>
              <div className="relative mt-1.5">
                <select
                  id={selectId}
                  value={selectedDateId}
                  onChange={(e) => setSelectedDateId(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-charcoal focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                >
                  {tour.dates.map((d) => {
                    const bookable = dateFitsGuestCount(d, guests, tour.groupMin);
                    return (
                      <option key={d.id} value={d.id} disabled={!bookable}>
                        {formatDateRange(d.startDate, d.endDate)} ({d.spotsLeft}{" "}
                        {spotsWord(d.spotsLeft)})
                        {dateOptionSuffix(d, guests, tour.groupMin)}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
                  aria-hidden
                />
              </div>
              {scheduledError && (
                <div className="mt-2 space-y-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-950">
                  <p>{scheduledError}</p>
                  {suggestion && <p className="text-amber-900/90">{suggestion}</p>}
                  {bookableAlternatives.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {bookableAlternatives.slice(0, 3).map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setSelectedDateId(d.id)}
                          className="rounded-lg border border-amber-200 bg-white px-2.5 py-1 text-xs font-medium text-charcoal transition-colors hover:border-brand hover:text-brand"
                        >
                          {formatDateRange(d.startDate, d.endDate)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {showCustomPicker && (
            <div className="space-y-3">
              <div className="flex gap-3 rounded-xl bg-sky/10 p-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />
                <div className="text-sm leading-relaxed text-charcoal">
                  <p className="font-medium">Индивидуальный заезд</p>
                  {tour.requestDateFrom && tour.requestDateTo && (
                    <p className="mt-1 text-slate">
                      Доступны любые даты в период {formatDateRange(tour.requestDateFrom, tour.requestDateTo)}
                    </p>
                  )}
                  <p className="mt-1 text-slate">
                    Только ваша группа, даты по согласованию с организатором
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor={customDateId} className="mb-1.5 block text-sm font-medium text-charcoal">
                  Желаемая дата начала
                </label>
                <SingleDatePicker
                  id={customDateId}
                  value={customDate}
                  onChange={setCustomDate}
                  min={tour.requestDateFrom}
                  max={tour.requestDateTo}
                  disablePast
                  placeholder="Выберите дату начала"
                />
              </div>
            </div>
          )}

          {collapsible && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="text-sm font-medium text-slate transition-colors hover:text-charcoal"
            >
              ← Свернуть
            </button>
          )}
        </>
      )}
    </div>
  );
}

export function validateBookingDates(
  tour: TourDetail,
  dateMode: BookingDateMode,
  customDate: Date | null,
  guests: number,
  selectedDateId: string
): string | null {
  const bookingMode = tour.bookingMode ?? "scheduled";

  if (dateMode === "custom" && canPickCustom(bookingMode) && !customDate) {
    return "Выберите желаемую дату начала тура";
  }

  if (
    dateMode === "scheduled" &&
    canPickScheduled(bookingMode) &&
    tour.dates.length === 0
  ) {
    return "Нет доступных дат для бронирования";
  }

  if (dateMode === "scheduled" && canPickScheduled(bookingMode)) {
    return validateGuestsForScheduledBooking(tour, guests, selectedDateId);
  }

  return null;
}
