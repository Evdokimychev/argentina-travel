export function hasDiscount(
  originalPriceUsd: number | undefined,
  priceUsd: number
): boolean {
  return originalPriceUsd != null && originalPriceUsd > priceUsd;
}

export function getDiscountPercent(
  originalPriceUsd: number,
  priceUsd: number
): number {
  return Math.round((1 - priceUsd / originalPriceUsd) * 100);
}
