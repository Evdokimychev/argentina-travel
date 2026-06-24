/** Shared YouTravel partner price normalization (scripts). */

const YOUTRAVEL_MISLABELED_LOW_DENOMINATION_THRESHOLD = 10000;
const HIGH_DENOMINATION_CURRENCIES = new Set(["ARS", "CLP", "RUB"]);

export function normalizeYouTravelPartnerPrice(value, currency) {
  const parsed = Number(value);
  if (value == null || !Number.isFinite(parsed) || parsed <= 0) {
    return { value: null, currency: currency?.trim().toUpperCase() || null };
  }

  const normalizedCurrency = currency?.trim().toUpperCase() || "USD";
  if (
    !HIGH_DENOMINATION_CURRENCIES.has(normalizedCurrency) &&
    parsed >= YOUTRAVEL_MISLABELED_LOW_DENOMINATION_THRESHOLD
  ) {
    return { value: parsed, currency: "RUB" };
  }

  return { value: parsed, currency: normalizedCurrency };
}
