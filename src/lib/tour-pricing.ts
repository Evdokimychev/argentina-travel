import type { TourDatePrice } from "@/types";
import { resolveTourDatePriceSummary } from "@/lib/tour-date-pricing";
import {
  TOUR_PRICE_ON_REQUEST_LABEL,
  resolveTourPriceFromPrefix,
  type TourPublicPriceInput,
} from "@/lib/tour-price-public";

export interface TourListingPriceInput extends TourPublicPriceInput {
  dates?: Array<Pick<TourDatePrice, "priceUsd">>;
}

/** Единый источник «от …» для каталога, карточки и PDF. */
export function resolveCatalogPriceUsd(input: TourListingPriceInput): number {
  if (input.priceOnRequest) return input.priceUsd;
  if (input.dates?.length) {
    return resolveTourDatePriceSummary(input.dates, input.priceUsd).catalogPriceUsd;
  }
  return input.priceUsd;
}

/** Формат цены для PDF и экспорта — USD, без конвертации в ₽. */
export function formatTourPriceForPdf(input: TourPublicPriceInput & { priceUsd: number }): string {
  if (input.priceOnRequest) return TOUR_PRICE_ON_REQUEST_LABEL;
  const prefix = resolveTourPriceFromPrefix(input) ? "от " : "";
  const formatted = new Intl.NumberFormat("ru-RU").format(Math.round(input.priceUsd));
  return `${prefix}$${formatted} USD`;
}

/** Сравнение базовой и каталожной цены — для QA и тестов. */
export function tourPriceSourcesMatch(
  listingPriceUsd: number,
  detailPriceUsd: number,
  dates?: Array<Pick<TourDatePrice, "priceUsd">>
): boolean {
  const catalogFromListing = resolveCatalogPriceUsd({ priceUsd: listingPriceUsd, dates });
  const catalogFromDetail = resolveCatalogPriceUsd({ priceUsd: detailPriceUsd, dates });
  return catalogFromListing === catalogFromDetail && listingPriceUsd === detailPriceUsd;
}
