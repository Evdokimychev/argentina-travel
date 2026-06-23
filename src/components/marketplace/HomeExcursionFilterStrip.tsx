"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ExcursionFilterBar from "@/components/excursions/ExcursionFilterBar";
import {
  EXCURSION_FILTER_PRICE_MAX_USD,
  excursionFiltersToSearchParams,
  getDefaultExcursionCatalogFilters,
  type ExcursionCatalogFilters,
} from "@/lib/excursion-catalog-filters";

export default function HomeExcursionFilterStrip() {
  const router = useRouter();
  const [filters, setFilters] = useState<ExcursionCatalogFilters>(() =>
    getDefaultExcursionCatalogFilters(),
  );

  function handleChange(next: ExcursionCatalogFilters) {
    setFilters(next);
    const params = excursionFiltersToSearchParams(next);
    const suffix = params.toString();
    router.push(suffix ? `/excursions?${suffix}` : "/excursions");
  }

  return (
    <ExcursionFilterBar
      filters={filters}
      priceMax={EXCURSION_FILTER_PRICE_MAX_USD}
      hasUsdPrices
      onChange={handleChange}
    />
  );
}
