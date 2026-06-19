import type { TourPublicPriceInput } from "@/lib/tour-price-public";

/** Демо: туры с ценой по запросу по slug каталога. */
export const TOUR_PRICE_ON_REQUEST_SEEDS: Record<
  string,
  Pick<TourPublicPriceInput, "priceOnRequest" | "priceFromPrefix"> & { referencePriceUsd?: number }
> = {
  "buenos-aires-tango": {
    priceOnRequest: true,
    priceFromPrefix: true,
    referencePriceUsd: 967,
  },
  "bariloche-lakes": {
    priceOnRequest: true,
    priceFromPrefix: false,
  },
  "salta-northwest": {
    priceOnRequest: true,
    priceFromPrefix: true,
    referencePriceUsd: 1240,
  },
};

export function getPriceOnRequestSeedForSlug(slug: string) {
  return TOUR_PRICE_ON_REQUEST_SEEDS[slug];
}
