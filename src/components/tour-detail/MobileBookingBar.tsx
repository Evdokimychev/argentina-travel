"use client";

import { useState } from "react";
import { TourDetail } from "@/types";
import TourPriceDisplay from "./TourPriceDisplay";
import { useTourBooking } from "./TourBookingContext";
import { validateBookingDates } from "./BookingDateSelector";

export default function MobileBookingBar({ tour }: { tour: TourDetail }) {
  const {
    totalPriceUsd,
    totalOriginalPriceUsd,
    openCheckout,
    dateMode,
    customDate,
    guests,
    selectedDateId,
  } = useTourBooking();
  const [error, setError] = useState<string | null>(null);

  function handleBookClick() {
    const dateError = validateBookingDates(
      tour,
      dateMode,
      customDate,
      guests,
      selectedDateId
    );
    if (dateError) {
      setError(dateError);
      return;
    }
    setError(null);
    if (!openCheckout()) {
      setError("Не удалось открыть бронирование. Проверьте дату и количество туристов.");
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white p-4 shadow-lg lg:hidden">
      <div className="mx-auto flex max-w-7xl flex-col gap-2">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
        )}
        <div className="flex items-center justify-between gap-4">
          <TourPriceDisplay
            priceUsd={totalPriceUsd}
            originalPriceUsd={totalOriginalPriceUsd}
            size="sm"
            showFrom={false}
          />
          <button
            type="button"
            onClick={handleBookClick}
            className="flex-1 rounded-xl bg-patagonia py-3 text-center text-sm font-semibold text-white"
          >
            Забронировать
          </button>
        </div>
      </div>
    </div>
  );
}
