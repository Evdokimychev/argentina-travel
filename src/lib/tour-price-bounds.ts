import { TourListing, TourFilters } from "@/types";
import { CurrencyCode } from "@/types/locale";
import { convertFromUsd, getFilterPriceMax, getSliderPriceBounds, getSliderPriceStep } from "@/lib/currency";

export function getTourPriceBounds(
  tours: TourListing[],
  currency: CurrencyCode
): { min: number; max: number } {
  if (tours.length === 0) {
    return { min: 0, max: getFilterPriceMax(currency) };
  }

  const prices = tours.map((t) => convertFromUsd(t.priceUsd, currency));
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

export function getDefaultPriceRange(
  tours: TourListing[],
  currency: CurrencyCode
): Pick<TourFilters, "priceMin" | "priceMax"> {
  const { min } = getTourPriceBounds(tours, currency);
  const priceMaxLimit = getFilterPriceMax(currency);
  const step = getSliderPriceStep(min, priceMaxLimit);
  const { max } = getSliderPriceBounds(min, priceMaxLimit, step);
  return {
    priceMin: min,
    priceMax: max,
  };
}

export function isPriceFilterActive(
  priceMin: number,
  priceMax: number,
  currency: CurrencyCode,
  tours: TourListing[]
): boolean {
  const { min: catalogMin } = getTourPriceBounds(tours, currency);
  const priceMaxLimit = getFilterPriceMax(currency);
  const step = getSliderPriceStep(catalogMin, priceMaxLimit);
  const { max: sliderMaxLimit } = getSliderPriceBounds(catalogMin, priceMaxLimit, step);
  const effectiveMax = priceMax || sliderMaxLimit;
  return priceMin > catalogMin || effectiveMax < sliderMaxLimit;
}

/**
 * Syncs price range when catalog bounds or currency change.
 * Resets to full range if the user had not narrowed the price filter.
 */
export function syncPriceFilters(
  filters: TourFilters,
  tours: TourListing[],
  currency: CurrencyCode,
  prevCatalogMin: number | null
): { filters: TourFilters; catalogMin: number } {
  const { min: catalogMin } = getTourPriceBounds(tours, currency);
  const priceMaxLimit = getFilterPriceMax(currency);
  const step = getSliderPriceStep(catalogMin, priceMaxLimit);
  const { max: sliderMaxLimit } = getSliderPriceBounds(catalogMin, priceMaxLimit, step);
  const effectiveMax = filters.priceMax || sliderMaxLimit;

  const wasFullRange =
    prevCatalogMin != null &&
    filters.priceMin >= prevCatalogMin &&
    effectiveMax >= sliderMaxLimit;

  const active = isPriceFilterActive(
    filters.priceMin,
    filters.priceMax,
    currency,
    tours
  );

  if (prevCatalogMin == null || wasFullRange || !active) {
    return {
      filters: {
        ...filters,
        priceMin: catalogMin,
        priceMax: sliderMaxLimit,
      },
      catalogMin,
    };
  }

  return {
    filters: {
      ...filters,
      priceMin: Math.max(filters.priceMin, catalogMin),
      priceMax: Math.min(effectiveMax, sliderMaxLimit),
    },
    catalogMin,
  };
}

export function clampPriceRange(
  priceMin: number,
  priceMax: number,
  catalogMin: number,
  priceMaxLimit: number
): { priceMin: number; priceMax: number } {
  const min = Math.max(catalogMin, Math.min(priceMin, priceMaxLimit));
  const max = Math.max(min, Math.min(priceMax || priceMaxLimit, priceMaxLimit));
  return { priceMin: min, priceMax: max };
}
