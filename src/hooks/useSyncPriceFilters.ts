"use client";

import { useEffect, useRef } from "react";
import { TourFilters, TourListing } from "@/types";
import { CurrencyCode } from "@/types/locale";
import { syncPriceFilters } from "@/lib/tour-price-bounds";

/** Keeps priceMin/priceMax aligned with catalog bounds and currency */
export function useSyncPriceFilters(
  tours: TourListing[],
  currency: CurrencyCode,
  setFilters: React.Dispatch<React.SetStateAction<TourFilters>>
) {
  const catalogMinRef = useRef<number | null>(null);

  useEffect(() => {
    setFilters((f) => {
      const result = syncPriceFilters(f, tours, currency, catalogMinRef.current);
      catalogMinRef.current = result.catalogMin;
      return result.filters;
    });
  }, [tours, currency, setFilters]);
}
