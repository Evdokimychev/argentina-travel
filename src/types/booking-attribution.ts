/** First-touch marketing attribution captured at checkout. */
export type BookingAttribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  /** Privacy-safe creative/placement slot from utm_content when present. */
  utmContent?: string;
  referrer?: string;
  landingPath?: string;
  apiKeyId?: string;
  capturedAt?: string;
};

export type BookingAttributionSourceKey = string;

export const BOOKING_ATTRIBUTION_DIRECT_KEY = "(direct)";

export const BOOKING_ATTRIBUTION_FIELD_LABELS: Record<
  keyof Pick<
    BookingAttribution,
    "utmSource" | "utmMedium" | "utmCampaign" | "referrer" | "landingPath"
  >,
  string
> = {
  utmSource: "Источник (utm_source)",
  utmMedium: "Канал (utm_medium)",
  utmCampaign: "Кампания (utm_campaign)",
  referrer: "Реферер",
  landingPath: "Страница входа",
};

/** Человекочитаемая метка источника для списков и фильтров. */
export function formatAttributionSourceLabel(
  attribution: BookingAttribution | undefined | null
): string {
  if (!attribution?.utmSource?.trim()) {
    return "Прямой заход";
  }
  return attribution.utmSource.trim();
}

/** Ключ группировки бронирований по источнику. */
export function attributionSourceKey(
  attribution: BookingAttribution | undefined | null
): BookingAttributionSourceKey {
  const source = attribution?.utmSource?.trim();
  return source || BOOKING_ATTRIBUTION_DIRECT_KEY;
}

export function hasAttributionData(
  attribution: BookingAttribution | undefined | null
): boolean {
  if (!attribution) return false;
  return Boolean(
    attribution.utmSource?.trim() ||
      attribution.utmMedium?.trim() ||
      attribution.utmCampaign?.trim() ||
      attribution.utmContent?.trim() ||
      attribution.referrer?.trim() ||
      attribution.landingPath?.trim() ||
      attribution.apiKeyId?.trim()
  );
}
