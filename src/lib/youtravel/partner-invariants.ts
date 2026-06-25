import { convertToUsd } from "@/lib/currency";
import type { CurrencyCode } from "@/types/locale";
import type { YouTravelDepartureCapacity } from "@/lib/youtravel/partner-tour-details";

const MIN_SANE_TOUR_USD = 25;
/** Upper bound for a single departure list price — catches RUB-scale values still labeled USD. */
const MAX_SANE_TOUR_USD = 15_000;

export type DepartureCapacityInput = Pick<
  YouTravelDepartureCapacity,
  "total" | "booked" | "free"
>;

/** Ensures total = booked + free and counts stay within [0, total]. */
export function assertDepartureCapacityConsistent(
  capacity: DepartureCapacityInput,
  context = "departure capacity"
): void {
  const { total, booked, free } = capacity;

  if (!Number.isFinite(total) || total <= 0) {
    throw new Error(`${context}: total must be a positive number, got ${total}`);
  }
  if (!Number.isFinite(booked) || booked < 0) {
    throw new Error(`${context}: booked must be non-negative, got ${booked}`);
  }
  if (!Number.isFinite(free) || free < 0) {
    throw new Error(`${context}: free must be non-negative, got ${free}`);
  }
  if (booked > total) {
    throw new Error(`${context}: booked (${booked}) exceeds total (${total})`);
  }
  if (free > total) {
    throw new Error(`${context}: free (${free}) exceeds total (${total})`);
  }
  if (booked + free !== total) {
    throw new Error(
      `${context}: booked (${booked}) + free (${free}) must equal total (${total})`
    );
  }
}

export type PriceNormalizationInput = {
  rawValue: number;
  rawCurrency: string;
  normalizedValue: number | null;
  normalizedCurrency: string | null;
  priceUsd: number | null;
};

/**
 * Guards against mislabeled partner currencies producing absurd catalog USD amounts.
 * Throws when normalized USD is outside plausible tour price bounds.
 */
export function assertPriceNormalizationSane(
  input: PriceNormalizationInput,
  context = "partner price"
): void {
  const { rawValue, rawCurrency, normalizedValue, normalizedCurrency, priceUsd } = input;

  if (priceUsd == null || !Number.isFinite(priceUsd) || priceUsd <= 0) {
    throw new Error(`${context}: priceUsd must be a positive number, got ${priceUsd}`);
  }

  if (priceUsd < MIN_SANE_TOUR_USD || priceUsd > MAX_SANE_TOUR_USD) {
    throw new Error(
      `${context}: priceUsd ${priceUsd} outside sane tour bounds ` +
        `[${MIN_SANE_TOUR_USD}, ${MAX_SANE_TOUR_USD}] ` +
        `(raw ${rawValue} ${rawCurrency} → ${normalizedValue} ${normalizedCurrency})`
    );
  }

  if (normalizedCurrency === "USD" && normalizedValue != null) {
    const drift = Math.abs(priceUsd - normalizedValue) / normalizedValue;
    if (drift > 0.01) {
      throw new Error(
        `${context}: USD-labeled priceUsd (${priceUsd}) diverges from normalized value (${normalizedValue})`
      );
    }
  }
}

export function resolveNormalizedPriceUsd(
  value: number,
  currency: string
): number | null {
  const normalizedCurrency = currency.trim().toUpperCase();
  if (normalizedCurrency === "USD") return value;
  if (["RUB", "EUR", "ARS", "CLP"].includes(normalizedCurrency)) {
    return convertToUsd(value, normalizedCurrency as CurrencyCode);
  }
  return null;
}
