import type { PartnerTourContent } from "@/lib/tripster/partner-tour-content";
import { formatPartnerListedPrice } from "@/lib/tripster/partner-tour-price";
import { htmlToPlainText, isHtmlContent, markdownLiteToHtml, sanitizeHtml } from "@/lib/rich-text";
import type { YouTravelTour } from "@/lib/youtravel/types";

function toHtml(value: string | undefined | null): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (isHtmlContent(trimmed)) return sanitizeHtml(trimmed);
  return sanitizeHtml(markdownLiteToHtml(trimmed));
}

function toStringList(value: string[] | string | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean);
  return value
    .split(/\n|•|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function listToHtml(items: string[]): string | undefined {
  if (!items.length) return undefined;
  return sanitizeHtml(`<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`);
}

function resolvePriceDescription(payload: YouTravelTour, row?: {
  price_value?: number | null;
  price_currency?: string | null;
  price_display?: string | null;
}): string | undefined {
  if (row?.price_display?.trim()) return row.price_display.trim();
  const value = row?.price_value ?? payload.priceFrom ?? payload.minPrice ?? payload.price;
  const currency = row?.price_currency ?? payload.currency;
  if (value != null && currency) {
    return formatPartnerListedPrice(Number(value), String(currency).toUpperCase());
  }
  return undefined;
}

export function buildYouTravelPartnerContent(
  payload: YouTravelTour,
  row?: {
    price_value?: number | null;
    price_currency?: string | null;
    price_display?: string | null;
  }
): PartnerTourContent {
  const summary =
    payload.shortDescription?.trim() ||
    payload.subtitle?.trim() ||
    payload.annotation?.trim() ||
    htmlToPlainText(payload.description ?? "").slice(0, 280);

  const descriptionHtml = toHtml(payload.description);
  const includedItems = toStringList(payload.included);
  const excludedItems = toStringList(payload.notIncluded);
  const importantItems = toStringList(payload.importantInfo);

  const blocks = [];
  if (payload.annotation?.trim() && payload.annotation.trim() !== summary) {
    const html = toHtml(payload.annotation);
    if (html) blocks.push({ title: "Кратко о туре", html });
  }

  return {
    summary: summary || undefined,
    introHtml: descriptionHtml,
    format: payload.activityType?.trim() || payload.type?.trim() || "Авторский тур",
    blocks,
    includedHtml: listToHtml(includedItems),
    excludedHtml: listToHtml(excludedItems),
    additionalInfoHtml: listToHtml(importantItems),
    meetingPoint:
      typeof payload.city === "string"
        ? payload.city
        : payload.city?.nameRu ?? payload.city?.name ?? payload.destination,
    priceDescription: resolvePriceDescription(payload, row),
    childFriendly: true,
    languages: payload.languages?.length ? payload.languages : ["Русский"],
    isBookable: true,
  };
}

export function resolveYouTravelGallery(payload: YouTravelTour, rowPhotos?: unknown): string[] {
  const urls: string[] = [];

  const push = (value: unknown) => {
    if (typeof value === "string" && value.trim()) urls.push(value.trim());
    if (value && typeof value === "object") {
      const photo = value as { medium?: string; url?: string; src?: string; thumbnail?: string };
      const resolved =
        photo.medium?.trim() || photo.url?.trim() || photo.src?.trim() || photo.thumbnail?.trim();
      if (resolved) urls.push(resolved);
    }
  };

  const photos = Array.isArray(rowPhotos)
    ? rowPhotos
    : payload.photos ?? payload.gallery ?? [];
  if (Array.isArray(photos)) {
    for (const item of photos) push(item);
  }

  if (payload.coverImage?.trim()) urls.unshift(payload.coverImage.trim());
  if (payload.image?.trim()) urls.unshift(payload.image.trim());

  return [...new Set(urls)];
}

/** Parse program from flexible payload shapes. */
export function resolveYouTravelProgram(payload: YouTravelTour): unknown[] {
  const candidates = [
    payload.program,
    payload.itinerary,
    (payload as { days?: unknown }).days,
    (payload as { programDays?: unknown }).programDays,
    (payload as { tourProgram?: unknown }).tourProgram,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length) return candidate;
  }

  return [];
}
