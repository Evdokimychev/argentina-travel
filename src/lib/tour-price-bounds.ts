import { TourListing, TourFilters } from "@/types";
import { CurrencyCode } from "@/types/locale";
import { resolveListingFilterPriceUsd } from "@/lib/partner-tours/filter-price";
import { convertFromUsd, getFilterPriceMax, getSliderPriceBounds, getSliderPriceStep, convertToUsd } from "@/lib/currency";

export function getTourPriceBounds(
  tours: TourListing[],
  currency: CurrencyCode
): { min: number; max: number } {
  const prices = tours
    .map((t) => resolveListingFilterPriceUsd(t))
    .filter((price): price is number => price != null)
    .map((price) => convertFromUsd(price, currency));

  if (prices.length === 0) {
    return { min: 0, max: getFilterPriceMax(currency) };
  }

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

export function getDefaultPriceRange(
  tours: TourListing[],
  currency: CurrencyCode
): Pick<TourFilters, "priceMin" | "priceMax"> {
  const { min, max: catalogMax } = getTourPriceBounds(tours, currency);
  const priceMaxLimit = getFilterPriceMax(currency);
  const sliderCeiling = Math.max(catalogMax, priceMaxLimit);
  const step = getSliderPriceStep(min, sliderCeiling);
  const { max } = getSliderPriceBounds(min, sliderCeiling, step);
  return {
    priceMin: min,
    // Slider snap can round below the true catalog max — never exclude the priciest tour by default.
    priceMax: Math.max(max, catalogMax),
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
  prevCatalogMin: number | null,
  prevCurrency: CurrencyCode | null = null
): { filters: TourFilters; catalogMin: number } {
  let nextFilters = filters;

  if (prevCurrency && prevCurrency !== currency) {
    const prevMax =
      filters.priceMax > 0 ? filters.priceMax : getFilterPriceMax(prevCurrency);
    nextFilters = {
      ...filters,
      priceMin: convertFromUsd(convertToUsd(filters.priceMin, prevCurrency), currency),
      priceMax: convertFromUsd(convertToUsd(prevMax, prevCurrency), currency),
    };
  }

  const { min: catalogMin, max: catalogMax } = getTourPriceBounds(tours, currency);
  const priceMaxLimit = getFilterPriceMax(currency);
  const sliderCeiling = Math.max(catalogMax, priceMaxLimit);
  const step = getSliderPriceStep(catalogMin, sliderCeiling);
  const { max: sliderMaxLimit } = getSliderPriceBounds(catalogMin, sliderCeiling, step);
  const effectiveMax = nextFilters.priceMax || sliderMaxLimit;

  const wasFullRange =
    prevCatalogMin != null &&
    nextFilters.priceMin >= prevCatalogMin &&
    effectiveMax >= sliderMaxLimit;

  const active = isPriceFilterActive(
    nextFilters.priceMin,
    nextFilters.priceMax,
    currency,
    tours
  );

  if (prevCatalogMin == null || wasFullRange || !active) {
    return {
      filters: {
        ...nextFilters,
        priceMin: catalogMin,
        priceMax: Math.max(sliderMaxLimit, catalogMax),
      },
      catalogMin,
    };
  }

  return {
    filters: {
      ...nextFilters,
      priceMin: Math.max(nextFilters.priceMin, catalogMin),
      priceMax: Math.min(effectiveMax, sliderMaxLimit),
    },
    catalogMin,
  };
}

export function resolvePriceFilterSliderTrackMax(input: {
  priceMin: number;
  priceMax: number;
  catalogMin: number;
  fullSliderMax: number;
  filterCap: number;
}): number {
  const effectiveMax = input.priceMax || input.fullSliderMax;
  const narrowed =
    effectiveMax < input.fullSliderMax * 0.9 &&
    input.fullSliderMax > input.filterCap * 1.2;

  if (!narrowed) return input.fullSliderMax;

  return Math.min(
    input.fullSliderMax,
    Math.max(effectiveMax, input.priceMin, input.catalogMin, input.filterCap)
  );
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
