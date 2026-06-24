import type { ChildrenPolicy } from "@/types";
import { CHILDREN_OPTIONS } from "@/data/filters";
import type { PartnerTourContent } from "@/lib/tripster/partner-tour-content";
import { dedupeGalleryImages } from "@/lib/gallery-images";
import { formatPartnerListedPrice } from "@/lib/tripster/partner-tour-price";
import { htmlToPlainText, isHtmlContent, markdownLiteToHtml, plainTextFromRichContent, sanitizeHtml, escapeHtml } from "@/lib/rich-text";
import {
  resolveYouTravelActivityLevelFromPayload,
  resolveYouTravelComfortLevelFromPayload,
  resolveYouTravelComfortDetailLabel,
  YOUTRAVEL_ACTIVITY_LEVELS,
  YOUTRAVEL_COMFORT_LEVELS,
} from "@/lib/youtravel/partner-levels";
import {
  resolveYouTravelInstantBooking,
  resolveYouTravelTourGuaranteed,
} from "@/lib/youtravel/partner-tour-details";
import type { YouTravelProgramDay, YouTravelTour } from "@/lib/youtravel/types";
import {
  parseYouTravelArrivalDateTime,
  resolveYouTravelFinishCity,
  resolveYouTravelStartCity,
  normalizeYouTravelArrivalCityLabel,
} from "@/lib/youtravel/partner-tour-locations";

function toHtml(value: string | undefined | null): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (isHtmlContent(trimmed)) return sanitizeHtml(trimmed);
  return sanitizeHtml(markdownLiteToHtml(trimmed));
}

const YOUTRAVEL_CDN_HOST = "cf.youtravel.me";

/** Normalize YouTravel API media (string URL or `{ src, host }` object) to absolute https URL. */
export function resolveYouTravelMediaUrl(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${YOUTRAVEL_CDN_HOST}/${trimmed.replace(/^\//, "")}`;
  }

  if (!value || typeof value !== "object") return null;

  const record = value as {
    src?: string;
    url?: string;
    medium?: string;
    thumbnail?: string;
    host?: string;
  };
  const raw =
    record.src?.trim() ||
    record.url?.trim() ||
    record.medium?.trim() ||
    record.thumbnail?.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;

  const host = record.host?.trim() || YOUTRAVEL_CDN_HOST;
  return `https://${host.replace(/^\//, "")}/${raw.replace(/^\//, "")}`;
}

function looksLikeNewStringListItem(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  if (/^[А-ЯA-ZЁ][^:]{0,60}:/u.test(trimmed)) return true;
  if (/^\d+[\).]\s/u.test(trimmed)) return true;
  if (/^[А-ЯA-ZЁ]/u.test(trimmed)) return true;

  return false;
}

function coalesceStringListItems(items: string[]): string[] {
  const result: string[] = [];

  for (const raw of items) {
    const item = normalizePlainSpaces(raw);
    if (!item) continue;

    if (result.length === 0 || looksLikeNewStringListItem(item)) {
      result.push(item);
      continue;
    }

    result[result.length - 1] = `${result[result.length - 1]} ${item}`.replace(/\s+/g, " ").trim();
  }

  return result;
}

function extractListItemsFromHtml(html: string): string[] {
  const items: string[] = [];
  const pattern = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    const text = normalizePlainSpaces(htmlToPlainText(match[1] ?? ""));
    if (text) items.push(text);
  }

  return items;
}

function splitPlainStringList(value: string): string[] {
  return value
    .split(/\n|•|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toStringList(value: string[] | string | undefined): string[] {
  if (!value) return [];

  let rawItems: string[];

  if (Array.isArray(value)) {
    rawItems = value.flatMap((item) => {
      const trimmed = String(item ?? "").trim();
      if (!trimmed) return [];
      if (isHtmlContent(trimmed)) return extractListItemsFromHtml(trimmed);
      return splitPlainStringList(trimmed);
    });
  } else {
    const trimmed = value.trim();
    if (!trimmed) return [];
    rawItems = isHtmlContent(trimmed)
      ? extractListItemsFromHtml(trimmed)
      : splitPlainStringList(trimmed);
  }

  return coalesceStringListItems(rawItems);
}

function listToHtml(items: string[]): string | undefined {
  if (!items.length) return undefined;
  return sanitizeHtml(
    `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`,
  );
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

function normalizePlainSpaces(value: string): string {
  return value.replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
}

/** Split concatenated highlight tail from public JSON-LD descriptions. */
export function splitYouTravelHighlightTail(tail: string): string[] {
  return tail
    .split(/(?<=[a-zа-яё])(?=[A-ZА-ЯЁ])/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function mergeYouTravelDescriptionWithPublicHighlights(
  descriptionHtml: string | undefined,
  publicPlain: string | undefined | null,
): string | undefined {
  if (!publicPlain?.trim()) {
    return descriptionHtml?.trim() ? descriptionHtml : undefined;
  }

  const fullPlain = normalizePlainSpaces(publicPlain);

  if (!descriptionHtml?.trim()) {
    const sentenceEnd = fullPlain.match(/^(.+?[.!?])(.+)$/);
    if (sentenceEnd) {
      const body = sentenceEnd[1].trim();
      const items = splitYouTravelHighlightTail(sentenceEnd[2].trim());
      if (items.length >= 2) {
        const bodyHtml = sanitizeHtml(markdownLiteToHtml(body));
        const listHtml = sanitizeHtml(
          `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`,
        );
        return sanitizeHtml(`${bodyHtml}${listHtml}`);
      }
    }
    return sanitizeHtml(markdownLiteToHtml(fullPlain));
  }

  const partnerPlain = normalizePlainSpaces(htmlToPlainText(descriptionHtml));
  if (fullPlain.length <= partnerPlain.length + 8) return descriptionHtml;

  if (!fullPlain.startsWith(partnerPlain)) return descriptionHtml;

  const tail = fullPlain.slice(partnerPlain.length).trim();
  const items = splitYouTravelHighlightTail(tail);
  if (!items.length) return descriptionHtml;

  const listHtml = sanitizeHtml(
    `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`,
  );
  return sanitizeHtml(`${descriptionHtml}${listHtml}`);
}

export function resolveYouTravelPublicPlain(payload: YouTravelTour): string | undefined {
  return (
    payload.public_description?.trim() ||
    payload.public_page_extras?.schemaDescription?.trim() ||
    undefined
  );
}

export function resolveYouTravelIntroHtml(payload: YouTravelTour): string | undefined {
  const publicHtml = payload.public_page_extras?.descriptionHtml?.trim();
  if (publicHtml) return sanitizeHtml(publicHtml);

  const descriptionHtml = toHtml(payload.description);
  return mergeYouTravelDescriptionWithPublicHighlights(
    descriptionHtml,
    resolveYouTravelPublicPlain(payload),
  );
}

export function resolveYouTravelMinimumAge(payload: YouTravelTour): number {
  const raw = payload.age_from ?? payload.ageFrom;
  if (raw == null) return 0;
  const parsed = typeof raw === "number" ? raw : Number.parseInt(String(raw), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function resolveMinimumAge(payload: YouTravelTour): number | undefined {
  const minimumAge = resolveYouTravelMinimumAge(payload);
  if (payload.age_from == null && payload.ageFrom == null) return undefined;
  return minimumAge;
}

export function mapMinimumAgeToChildrenPolicy(minAge: number): ChildrenPolicy {
  if (minAge === 0) return "Без ограничений";
  if (minAge <= 2) return "От 2 лет";
  if (minAge <= 5) return "От 5 лет";
  if (minAge <= 8) return "От 8 лет";
  if (minAge <= 12) return "От 12 лет";
  if (minAge <= 16) return "От 16 лет";
  return "Только взрослые";
}

export function mapYouTravelChildrenSummaryToPolicy(payload: YouTravelTour): ChildrenPolicy {
  const summary = resolveYouTravelChildrenSummary(payload);
  if (!summary) return "Без ограничений";
  if ((CHILDREN_OPTIONS as readonly string[]).includes(summary)) {
    return summary as ChildrenPolicy;
  }
  return mapMinimumAgeToChildrenPolicy(resolveYouTravelMinimumAge(payload));
}

export function resolveYouTravelChildFriendly(payload: YouTravelTour): boolean {
  const minimumAge = resolveMinimumAge(payload);
  if (minimumAge == null) return true;
  return minimumAge <= 12;
}

function resolveMaximumAge(payload: YouTravelTour): number | undefined {
  const raw = payload.age_to ?? payload.ageTo;
  if (raw == null) return undefined;
  const parsed = typeof raw === "number" ? raw : Number.parseInt(String(raw), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function resolveYouTravelChildrenSummary(payload: YouTravelTour): string | undefined {
  const minimumAge = resolveMinimumAge(payload);
  const maximumAge = resolveMaximumAge(payload);

  if (minimumAge == null && maximumAge == null) return undefined;
  if (minimumAge != null && minimumAge >= 18) return "Только взрослые";
  if (minimumAge != null && maximumAge != null && maximumAge < 100) {
    return `${minimumAge}–${maximumAge} лет`;
  }
  if (minimumAge != null) {
    if (minimumAge <= 2) return "От 2 лет";
    if (minimumAge <= 5) return "От 5 лет";
    if (minimumAge <= 8) return "От 8 лет";
    if (minimumAge <= 12) return "От 12 лет";
    if (minimumAge <= 16) return "От 16 лет";
    return `От ${minimumAge} лет`;
  }

  return undefined;
}

function resolvePublicPageExtras(payload: YouTravelTour) {
  return payload.public_page_extras;
}

function resolveYouTravelActivityFields(payload: YouTravelTour): Pick<
  PartnerTourContent,
  "activityLevel" | "activityLabel" | "activityDescription" | "activityExpertComment"
> {
  const level = resolveYouTravelActivityLevelFromPayload(payload);
  if (!level) return {};

  const standard = YOUTRAVEL_ACTIVITY_LEVELS[level];
  const extras = resolvePublicPageExtras(payload);
  const apiDescription = payload.activity_data?.description?.trim();
  const publicDescription =
    extras?.activityDescription?.trim() ||
    payload.public_activity_description?.trim();
  const publicLabel =
    extras?.activityLabel?.trim() ||
    payload.public_activity_label?.trim();
  const expertComment =
    extras?.activityComment?.trim() || payload.public_activity_comment?.trim();

  return {
    activityLevel: level,
    activityLabel: publicLabel || standard.label,
    activityDescription: publicDescription || apiDescription || standard.description,
    activityExpertComment: expertComment || undefined,
  };
}

function resolveYouTravelComfortFields(payload: YouTravelTour): Pick<
  PartnerTourContent,
  "comfortLevel" | "comfortLabel" | "comfortDescription" | "comfortHtml"
> {
  const level = resolveYouTravelComfortLevelFromPayload(payload);
  if (!level) return {};

  const standard = YOUTRAVEL_COMFORT_LEVELS[level];
  const extras = resolvePublicPageExtras(payload);
  const apiDescription = payload.comfort_data?.description?.trim();
  const comfortDescription =
    extras?.comfortDescription?.trim() || apiDescription || standard.description;

  return {
    comfortLevel: level,
    comfortLabel: resolveYouTravelComfortDetailLabel({
      level,
      fallbackLabel: payload.comfort_data?.title,
    }),
    comfortDescription,
    comfortHtml: comfortDescription ? toHtml(comfortDescription) : undefined,
  };
}

function resolveYouTravelAccommodationFields(payload: YouTravelTour): Pick<
  PartnerTourContent,
  "accommodationTypesSummary" | "accommodationPhotos" | "accommodationRoomTypes"
> {
  const summary =
    typeof payload.type_allocation === "string" ? payload.type_allocation.trim() : undefined;
  const apiPhotos = Array.isArray(payload.photo_allocation)
    ? payload.photo_allocation
        .map((item) => resolveYouTravelMediaUrl(item))
        .filter((url): url is string => Boolean(url))
    : [];
  const publicPhotos = (payload.public_page_extras?.accommodationPhotos ?? [])
    .map((url) => url.trim())
    .filter(Boolean);
  const photos = dedupeGalleryImages([...apiPhotos, ...publicPhotos]);

  const roomTypes = Array.isArray(payload.type_accommodation)
    ? payload.type_accommodation
        .map((item, index) => {
          if (typeof item === "string") {
            const name = item.trim();
            return name ? { id: `yt-room-${index + 1}`, name } : null;
          }
          if (!item || typeof item !== "object") return null;
          const name = item.name?.trim();
          if (!name) return null;
          return {
            id: item.id != null ? String(item.id) : `yt-room-${index + 1}`,
            name,
          };
        })
        .filter((item): item is { id: string; name: string } => item != null)
    : [];

  if (!summary && !photos.length && !roomTypes.length) return {};

  return {
    accommodationTypesSummary: summary || undefined,
    accommodationPhotos: photos.length ? photos : undefined,
    accommodationRoomTypes: roomTypes.length ? roomTypes : undefined,
  };
}

import { resolveYouTravelImportantToKnowItems as resolveImportantToKnowItems } from "@/lib/youtravel/important-to-know";

function resolveYouTravelArrivalInfo(payload: YouTravelTour): PartnerTourContent["arrivalInfo"] {
  const scraped = payload.public_page_extras?.arrivalInfo;
  const startCityFromApi = resolveYouTravelStartCity(payload);
  const finishCityFromApi = resolveYouTravelFinishCity(payload);

  const startParsed = parseYouTravelArrivalDateTime(scraped?.start?.date);
  const finishParsed = parseYouTravelArrivalDateTime(scraped?.finish?.date);

  const startCity = normalizeYouTravelArrivalCityLabel(
    scraped?.start?.city?.trim() || startCityFromApi,
  );
  const finishCity = normalizeYouTravelArrivalCityLabel(
    scraped?.finish?.city?.trim() || finishCityFromApi,
  );
  const startDate = startParsed.datePart || scraped?.start?.date?.trim();
  const finishDate = finishParsed.datePart || scraped?.finish?.date?.trim();
  const startTime = startParsed.timePart;
  const finishTime = finishParsed.timePart;

  if (!startCity && !finishCity && !startDate && !finishDate && !startTime && !finishTime) {
    return undefined;
  }

  return {
    startLabel: scraped?.start?.label?.trim() || "Старт",
    startDate: startDate || undefined,
    startTime: startTime || undefined,
    startCity: startCity || undefined,
    finishLabel: scraped?.finish?.label?.trim() || "Финиш",
    finishDate: finishDate || undefined,
    finishTime: finishTime || undefined,
    finishCity: finishCity || undefined,
  };
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
    plainTextFromRichContent(
      payload.shortDescription ||
        payload.preview_text ||
        payload.previewText ||
        payload.subtitle ||
        payload.annotation,
    ) || htmlToPlainText(payload.description ?? "").slice(0, 280);

  const includedItems = toStringList(payload.included);
  const excludedItems = toStringList(payload.notIncluded ?? payload.not_included);
  const importantItems = toStringList(
    payload.importantInfo ??
      (payload.demands ? [String(payload.demands)] : undefined) ??
      payload.visa_info
  );

  const blocks = [];
  if (payload.annotation?.trim() && payload.annotation.trim() !== summary) {
    const html = toHtml(payload.annotation);
    if (html) blocks.push({ title: "Кратко о туре", html });
  }

  const arrivalInfo = resolveYouTravelArrivalInfo(payload);

  return {
    summary: summary || undefined,
    introHtml: resolveYouTravelIntroHtml(payload),
    format:
      payload.activityType?.trim() ||
      payload.main_type?.trim() ||
      payload.type?.trim() ||
      (Array.isArray(payload.types)
        ? payload.types.find(
            (item): item is { title?: string; main?: boolean } =>
              typeof item === "object" && item != null && item.main === true
          )?.title
        : undefined) ||
      "Авторский тур",
    blocks,
    includedHtml: listToHtml(includedItems),
    excludedHtml: listToHtml(excludedItems),
    additionalInfoHtml: listToHtml(importantItems),
    meetingPoint: arrivalInfo?.startCity ?? resolveYouTravelStartCity(payload),
    finishPoint: arrivalInfo?.finishCity ?? resolveYouTravelFinishCity(payload),
    priceDescription: resolvePriceDescription(payload, row),
    childFriendly: resolveYouTravelChildFriendly(payload),
    childrenSummary: resolveYouTravelChildrenSummary(payload),
    languages: payload.languages?.length ? payload.languages : ["Русский"],
    isBookable: true,
    instantBooking: resolveYouTravelInstantBooking(payload),
    tourGuaranteed: resolveYouTravelTourGuaranteed(payload),
    ...resolveYouTravelActivityFields(payload),
    ...resolveYouTravelComfortFields(payload),
    ...resolveYouTravelAccommodationFields(payload),
    importantToKnowItems: resolveImportantToKnowItems(payload),
    arrivalInfo,
  };
}

export function resolveYouTravelGallery(payload: YouTravelTour, rowPhotos?: unknown): string[] {
  const urls: string[] = [];

  const push = (value: unknown) => {
    const resolved = resolveYouTravelMediaUrl(value);
    if (resolved) urls.push(resolved);
  };

  const sources = [
    ...(Array.isArray(rowPhotos) ? rowPhotos : []),
    ...(Array.isArray(payload.photos) ? payload.photos : []),
    ...(Array.isArray(payload.gallery) ? payload.gallery : []),
    ...(Array.isArray(payload.photo_allocation) ? payload.photo_allocation : []),
  ];

  for (const item of sources) push(item);

  push(payload.coverImage);
  push(payload.image);
  push(payload.previewImage);
  push(payload.preview_image);

  return dedupeGalleryImages(urls);
}

/** Photos attached to a single program day (`photo` / `photos` / `gallery` on day object). */
export function resolveYouTravelDayPhotos(day: YouTravelProgramDay): string[] {
  const urls: string[] = [];
  const push = (value: unknown) => {
    const resolved = resolveYouTravelMediaUrl(value);
    if (resolved) urls.push(resolved);
  };

  const sources = [
    ...(Array.isArray(day.photo) ? day.photo : []),
    ...(Array.isArray(day.photos) ? day.photos : []),
    ...(Array.isArray(day.images) ? day.images : []),
    ...(Array.isArray(day.gallery) ? day.gallery : []),
  ];

  for (const item of sources) push(item);

  return dedupeGalleryImages(urls);
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
