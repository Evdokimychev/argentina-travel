import type { ExcursionListing } from "@/types/excursion";

export function excursionShowsPriceFrom(priceDisplay?: string): boolean {
  if (!priceDisplay?.trim()) return false;
  return /^(от|from|desde)\b/i.test(priceDisplay.trim());
}

export function resolveExcursionPriceUsd(excursion: Pick<ExcursionListing, "priceValue" | "priceCurrency">): number | null {
  if (excursion.priceValue == null || !Number.isFinite(excursion.priceValue)) {
    return null;
  }

  const currency = excursion.priceCurrency?.trim().toUpperCase();
  if (currency && currency !== "USD") {
    return null;
  }

  return excursion.priceValue;
}
