import type { BookingAttribution } from "@/types/booking-attribution";
import { getStoredFirstTouchAttribution } from "@/lib/attribution/first-touch";

export const CONVERSION_CONTEXT_STORAGE_KEY = "pva_conversion_context";

const MAX_FIELD = 240;

export type ConversionContext = {
  /** Stable placement id (not UI button copy). */
  placement?: string;
  productId?: string;
  productType?: "tour" | "excursion" | "article" | "place" | "service";
  entryPath?: string;
  source?: string;
  capturedAt?: string;
};

function trimField(value: string | null | undefined, max = MAX_FIELD): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

export function buildConversionContext(input: ConversionContext): ConversionContext | null {
  const context: ConversionContext = {
    placement: trimField(input.placement, 120),
    productId: trimField(input.productId, 120),
    productType: input.productType,
    entryPath: trimField(input.entryPath, 500),
    source: trimField(input.source, 120),
    capturedAt: input.capturedAt ?? new Date().toISOString(),
  };
  const hasData =
    context.placement ||
    context.productId ||
    context.productType ||
    context.entryPath ||
    context.source;
  return hasData ? context : null;
}

export function persistConversionContext(input: ConversionContext): ConversionContext | null {
  if (typeof window === "undefined") return null;
  const normalized = buildConversionContext(input);
  if (!normalized) return null;
  try {
    window.sessionStorage.setItem(CONVERSION_CONTEXT_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    /* ignore quota / private mode */
  }
  return normalized;
}

export function getStoredConversionContext(): ConversionContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CONVERSION_CONTEXT_STORAGE_KEY);
    if (!raw) return null;
    return buildConversionContext(JSON.parse(raw) as ConversionContext);
  } catch {
    return null;
  }
}

/**
 * Snapshot attached to lead/booking submits:
 * first-touch acquisition + last conversion context (placement/product).
 */
export function getSubmitAttributionBundle(): {
  firstTouch: BookingAttribution | null;
  conversionContext: ConversionContext | null;
} {
  return {
    firstTouch: getStoredFirstTouchAttribution(),
    conversionContext: getStoredConversionContext(),
  };
}
