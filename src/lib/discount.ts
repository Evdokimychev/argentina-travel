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

/** Базовая цена «до скидок» для бейджа и зачёркнутой суммы (каталог, дата, до групповой). */
export function resolveDiscountReferencePriceUsd(
  finalPriceUsd: number,
  ...referencePrices: Array<number | undefined | null>
): number | undefined {
  const valid = referencePrices.filter(
    (price): price is number => price != null && price > finalPriceUsd
  );
  return valid.length > 0 ? Math.max(...valid) : undefined;
}
