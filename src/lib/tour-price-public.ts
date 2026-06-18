/** Подпись для туров без фиксированной стоимости. */
export const TOUR_PRICE_ON_REQUEST_LABEL = "Цена по запросу";

export const TOUR_PRICE_ON_REQUEST_HINT =
  "Точная стоимость рассчитывается индивидуально — отправьте запрос организатору.";

export const TOUR_PRICE_ON_REQUEST_REFERENCE_HINT =
  "Ориентировочная стоимость. Итоговая цена зависит от состава группы, дат и пожеланий.";

export interface TourPublicPriceInput {
  priceUsd: number;
  priceOnRequest?: boolean;
  priceFromPrefix?: boolean;
}

export function tourHasFixedPrice(input: TourPublicPriceInput): boolean {
  return !input.priceOnRequest;
}

/** Цена для фильтров каталога: null — тур не участвует в диапазоне. */
export function resolveTourFilterPriceUsd(input: TourPublicPriceInput): number | null {
  if (input.priceOnRequest) {
    return input.priceUsd > 0 ? input.priceUsd : null;
  }
  return input.priceUsd;
}

/** Ориентир хранится в priceUsd, но на сайте не показывается — только для фильтров. */
export function tourShowsReferencePrice(input: TourPublicPriceInput): boolean {
  return Boolean(input.priceOnRequest && input.priceUsd > 0);
}

export function resolveTourPriceFromPrefix(input: TourPublicPriceInput): boolean {
  if (input.priceOnRequest) {
    return tourShowsReferencePrice(input) && Boolean(input.priceFromPrefix);
  }
  return Boolean(input.priceFromPrefix);
}
