"use client";

import Link from "next/link";
import TourPriceDisplay from "./TourPriceDisplay";
import { useTourBooking } from "./TourBookingContext";

export default function MobileBookingBar() {
  const { totalPriceUsd, totalOriginalPriceUsd } = useTourBooking();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white p-4 shadow-lg lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <TourPriceDisplay
          priceUsd={totalPriceUsd}
          originalPriceUsd={totalOriginalPriceUsd}
          size="sm"
          showFrom={false}
        />
        <Link
          href="/contacts"
          className="flex-1 rounded-xl bg-patagonia py-3 text-center text-sm font-semibold text-white"
        >
          Забронировать
        </Link>
      </div>
    </div>
  );
}
