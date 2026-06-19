import { addDays, format, parseISO } from "date-fns";
import { parseExcursionPayload } from "@/lib/tripster/excursion-payload";
import { mapPhotos } from "@/lib/tripster/mapper";
import type {
  TripsterExperience,
  TripsterScheduleResponse,
  TripsterScheduleSlot,
  TripsterTourPlanDay,
  TripsterTourPlanPhoto,
} from "@/lib/tripster/types";
import {
  htmlToPlainText,
  isHtmlContent,
  markdownLiteToHtml,
  sanitizeHtml,
} from "@/lib/rich-text";
import { dedupeGalleryImages, galleryImageIdentityKey } from "@/lib/gallery-images";
import {
  isPartnerAccommodationTitle,
  splitPartnerLodgingFromOrgDetails,
  type PartnerTourOvernightStop,
} from "@/lib/tripster/partner-tour-accommodation";
import type { PartnerTourExperienceRow } from "@/lib/tripster/partner-tour-mapper";
import type { TourDatePrice, TourItineraryDay } from "@/types";

type PartnerPhotoInput =
  | string
  | {
      medium?: string;
      thumbnail?: string;
      url?: string;
    };

function pickPhotoUrl(photo: PartnerPhotoInput): string | undefined {
  if (typeof photo === "string") {
    const trimmed = photo.trim();
    return trimmed || undefined;
  }

  return (
    photo.medium?.trim() ||
    photo.url?.trim() ||
    photo.thumbnail?.trim() ||
    undefined
  );
}

export type PartnerTourContentBlock = {
  title: string;
  html: string;
};

export type PartnerTourOrgDetailItem = {
  title: string;
  html: string;
};

export type PartnerTourContent = {
  summary?: string;
  introHtml?: string;
  format?: string;
  blocks: PartnerTourContentBlock[];
  orgDetailsIntroHtml?: string;
  orgDetailsItems?: PartnerTourOrgDetailItem[];
  orgDetailsExtraHtml?: string;
  includedHtml?: string;
  excludedHtml?: string;
  comfortHtml?: string;
  additionalInfoHtml?: string;
  accommodationIntroHtml?: string;
  accommodationItems?: PartnerTourOrgDetailItem[];
  accommodationOvernights?: PartnerTourOvernightStop[];
  /** Fallback HTML, если нет структурированных вариантов размещения */
  accommodationHtml?: string;
  movementType?: string;
  meetingPoint?: string;
  finishPoint?: string;
  priceDescription?: string;
  scheduleText?: string;
  instantBooking?: boolean;
  isBookable?: boolean;
  visitorsCount?: number;
};

const ORG_DETAILS_TITLE_PATTERN = /организационн/i;

const ORG_DETAIL_ITEM_TITLE_PATTERN =
  /^(питание|транспорт|виза|уровень сложности|возраст участников|проживание|сложность)/i;

function normalizeOrgDetailTitle(raw: string): string {
  return raw.replace(/[.:]+\s*$/, "").trim();
}

function normalizePartnerTextKey(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function isDuplicatePartnerHtml(candidate: string, existing: string[]): boolean {
  const key = normalizePartnerTextKey(htmlToPlainText(candidate));
  if (!key) return true;

  return existing.some((html) => {
    const existingKey = normalizePartnerTextKey(htmlToPlainText(html));
    if (!existingKey) return false;
    return existingKey === key || existingKey.includes(key) || key.includes(existingKey);
  });
}

function mergeOrgDetailItems(...groups: PartnerTourOrgDetailItem[][]): PartnerTourOrgDetailItem[] {
  const seen = new Set<string>();
  const merged: PartnerTourOrgDetailItem[] = [];

  for (const group of groups) {
    for (const item of group) {
      const key = normalizePartnerTextKey(item.title);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }

  return merged;
}

export function isPartnerOrgDetailItemTitle(title: string): boolean {
  return ORG_DETAIL_ITEM_TITLE_PATTERN.test(title.trim());
}

export function isPartnerOrgDetailsBlockTitle(title: string): boolean {
  return ORG_DETAILS_TITLE_PATTERN.test(title.trim());
}

/**
 * Парсит HTML блока «Организационные детали» / comfort_level_info Tripster:
 * абзацы с <strong>Заголовок.</strong> → пункты аккордеона, остальное — вводный текст.
 */
export function parseOrgDetailsAccordionHtml(html: string): {
  introHtml?: string;
  items: PartnerTourOrgDetailItem[];
} {
  const sanitized = sanitizeHtml(html).trim();
  if (!sanitized) return { items: [] };

  const headingPattern =
    /<p[^>]*>\s*<(?:strong|b)>([^<]+)<\/(?:strong|b)>\s*([\s\S]*?)<\/p>/gi;
  const matches: Array<{
    title: string;
    body: string;
    start: number;
    end: number;
  }> = [];

  let match: RegExpExecArray | null;
  while ((match = headingPattern.exec(sanitized))) {
    const title = normalizeOrgDetailTitle(match[1] ?? "");
    if (!title) continue;
    matches.push({
      title,
      body: match[2]?.trim() ?? "",
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  if (matches.length === 0) {
    return { introHtml: sanitized, items: [] };
  }

  const introHtml = sanitized.slice(0, matches[0].start).trim();
  const items: PartnerTourOrgDetailItem[] = [];

  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const nextStart = matches[index + 1]?.start ?? sanitized.length;
    const tail = sanitized.slice(current.end, nextStart).trim();
    const bodyHtml = current.body ? `<p>${current.body}</p>` : "";
    const itemHtml = sanitizeHtml(`${bodyHtml}${tail}`);
    if (!itemHtml) continue;
    items.push({ title: current.title, html: itemHtml });
  }

  return {
    introHtml: introHtml ? sanitizeHtml(introHtml) : undefined,
    items,
  };
}

/** @deprecated Use parseOrgDetailsAccordionHtml */
export function parseComfortLevelOrgDetails(html: string): PartnerTourOrgDetailItem[] {
  return parseOrgDetailsAccordionHtml(html).items;
}

function plainToHtml(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (isHtmlContent(trimmed)) return sanitizeHtml(trimmed);
  return sanitizeHtml(markdownLiteToHtml(trimmed));
}

export function htmlToBulletItems(html: string): string[] {
  const sanitized = sanitizeHtml(html);
  const items: string[] = [];
  const liPattern = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let match: RegExpExecArray | null;
  while ((match = liPattern.exec(sanitized))) {
    const text = htmlToPlainText(match[1] ?? "").trim();
    if (text) items.push(text);
  }
  if (items.length > 0) return items;

  const plain = htmlToPlainText(sanitized);
  if (!plain) return [];
  return plain
    .split(/\n+/)
    .flatMap((line) => line.split(/[;•·]/))
    .map((item) => item.replace(/^[\s\-–—*]+/, "").trim())
    .filter(Boolean);
}

export function resolvePartnerGallery(
  row: PartnerTourExperienceRow,
  experience: TripsterExperience
): string[] {
  const collected: string[] = [];

  const push = (url?: string | null) => {
    const resolved = url?.trim();
    if (resolved) collected.push(resolved);
  };

  const pushPhoto = (photo: PartnerPhotoInput) => {
    push(pickPhotoUrl(photo));
  };

  for (const photo of mapPhotos(experience.photos)) {
    pushPhoto(photo);
  }

  const rowPhotos = row.photos;
  if (Array.isArray(rowPhotos)) {
    for (const photo of rowPhotos) {
      pushPhoto(photo);
    }
  }

  push(row.cover_image);
  push(experience.cover_image);

  return dedupeGalleryImages(collected);
}

export function buildPartnerContent(experience: TripsterExperience): PartnerTourContent {
  const parsed = parseExcursionPayload(experience);
  const blocks: PartnerTourContentBlock[] = [];
  let orgDetailsIntroHtml: string | undefined;
  let orgDetailsItems: PartnerTourOrgDetailItem[] = [];

  for (const block of parsed.descriptionBlocks) {
    if (!block.title || !block.html) continue;
    if (isPartnerAccommodationTitle(block.title)) {
      orgDetailsItems.push({
        title: normalizeOrgDetailTitle(block.title),
        html: block.html,
      });
      continue;
    }
    if (isPartnerOrgDetailsBlockTitle(block.title)) {
      const parsedOrg = parseOrgDetailsAccordionHtml(block.html);
      if (parsedOrg.introHtml) {
        orgDetailsIntroHtml = parsedOrg.introHtml;
      }
      orgDetailsItems.push(...parsedOrg.items);
      continue;
    }
    if (isPartnerOrgDetailItemTitle(block.title)) {
      orgDetailsItems.push({
        title: normalizeOrgDetailTitle(block.title),
        html: block.html,
      });
      continue;
    }
    blocks.push({ title: block.title, html: block.html });
  }

  let introHtml: string | undefined;
  if (experience.annotation?.trim()) {
    const annotationHtml = plainToHtml(experience.annotation);
    const existingHtml = [
      ...blocks.map((block) => block.html),
      orgDetailsIntroHtml,
    ].filter(Boolean) as string[];

    if (!isDuplicatePartnerHtml(annotationHtml, existingHtml)) {
      introHtml = annotationHtml;
    }
  }

  const comfortSanitized = parsed.comfortLevelInfo
    ? sanitizeHtml(parsed.comfortLevelInfo)
    : undefined;
  const comfortParsed = comfortSanitized
    ? parseOrgDetailsAccordionHtml(comfortSanitized)
    : { items: [] as PartnerTourOrgDetailItem[] };

  orgDetailsItems = mergeOrgDetailItems(comfortParsed.items, orgDetailsItems);

  const lodgingSplit = splitPartnerLodgingFromOrgDetails(orgDetailsItems);
  orgDetailsItems = lodgingSplit.orgDetailsItems;
  const accommodationItems = lodgingSplit.accommodationItems;
  let accommodationIntroHtml: string | undefined;
  if (accommodationItems.length === 1 && accommodationItems[0]?.title === "Общая информация") {
    accommodationIntroHtml = accommodationItems[0].html;
  }

  if (!orgDetailsIntroHtml && comfortParsed.introHtml) {
    orgDetailsIntroHtml = comfortParsed.introHtml;
  }

  const orgDetailsExtraHtml =
    comfortSanitized && orgDetailsItems.length === 0 && !orgDetailsIntroHtml
      ? comfortSanitized
      : undefined;

  const additionalInfo = experience.additional_info?.trim();

  return {
    summary: experience.tagline?.trim() || undefined,
    introHtml,
    format: experience.format?.trim() || undefined,
    blocks,
    orgDetailsIntroHtml,
    orgDetailsItems: orgDetailsItems.length ? orgDetailsItems : undefined,
    orgDetailsExtraHtml,
    includedHtml: parsed.priceIncluded ? plainToHtml(parsed.priceIncluded) : undefined,
    excludedHtml: parsed.priceExcluded ? plainToHtml(parsed.priceExcluded) : undefined,
    comfortHtml:
      orgDetailsItems.length || orgDetailsExtraHtml || accommodationItems.length
        ? undefined
        : comfortSanitized,
    additionalInfoHtml: additionalInfo ? plainToHtml(additionalInfo) : undefined,
    accommodationIntroHtml,
    accommodationItems:
      accommodationItems.length && !accommodationIntroHtml ? accommodationItems : undefined,
    movementType: parsed.movementType,
    meetingPoint: parsed.meetingPoint?.text,
    finishPoint: parsed.finishPoint?.text,
    priceDescription: parsed.priceDescription,
    scheduleText: experience.schedule?.text?.trim() || undefined,
    instantBooking: experience.instant_booking,
    isBookable: parsed.isBookable,
    visitorsCount: parsed.visitorsCount,
  };
}

function pickPlanPhotoUrl(photo: TripsterTourPlanPhoto | string | undefined): string | undefined {
  if (!photo) return undefined;
  if (typeof photo === "string") {
    const trimmed = photo.trim();
    return trimmed || undefined;
  }
  return photo.medium?.trim() || photo.scaled?.trim() || photo.thumbnail?.trim() || undefined;
}

export function mapTripsterPlanToItinerary(plan: TripsterTourPlanDay[]): TourItineraryDay[] {
  return plan.map((day, index) => {
    const dayNumber = day.number ?? index + 1;
    const rawDescription = day.description?.trim() ?? "";
    const descriptionHtml = rawDescription
      ? isHtmlContent(rawDescription)
        ? sanitizeHtml(rawDescription)
        : sanitizeHtml(markdownLiteToHtml(rawDescription))
      : undefined;

    const images: string[] = [];
    const seen = new Set<string>();
    for (const photo of day.photos ?? []) {
      const url = pickPlanPhotoUrl(photo);
      if (!url) continue;
      const key = galleryImageIdentityKey(url);
      if (seen.has(key)) continue;
      seen.add(key);
      images.push(url);
    }

    return {
      id: `tripster-plan-day-${dayNumber}`,
      dayNumber,
      title: day.title?.trim() || `День ${dayNumber}`,
      description: descriptionHtml ? htmlToPlainText(descriptionHtml) : rawDescription,
      descriptionHtml,
      images,
      activities: [],
      meals: [],
      accommodation: "",
    };
  });
}

export function mapPartnerItineraryFromContent(
  content: PartnerTourContent,
  experience: TripsterExperience
): TourItineraryDay[] {
  const dayBlocks = content.blocks.filter((block) => /(^|\s)день\s*\d+/i.test(block.title));

  if (dayBlocks.length) {
    return dayBlocks.map((block, index) => {
      const dayMatch = block.title.match(/(\d+)/);
      const dayNumber = dayMatch ? Number.parseInt(dayMatch[1]!, 10) : index + 1;
      return {
        id: `tripster-partner-day-${dayNumber}`,
        dayNumber,
        title: block.title,
        description: htmlToPlainText(block.html),
        descriptionHtml: block.html,
        images: [],
        activities: [],
        meals: [],
        accommodation: "",
      };
    });
  }

  return (experience.description_blocks ?? [])
    .filter((block) => Array.isArray(block) && /день/i.test(String(block[0] ?? "")))
    .map((block, index) => {
      const title = String(block[0] ?? "").trim();
      const html = sanitizeHtml(String(block[1] ?? ""));
      const dayMatch = title.match(/(\d+)/);
      const dayNumber = dayMatch ? Number.parseInt(dayMatch[1]!, 10) : index + 1;
      return {
        id: `tripster-block-day-${dayNumber}`,
        dayNumber,
        title,
        description: htmlToPlainText(html),
        descriptionHtml: html,
        images: [],
        activities: [],
        meals: [],
        accommodation: "",
      };
    });
}

export function resolveScheduleSlotSpotsLeft(
  slot: TripsterScheduleSlot,
  defaults?: TripsterScheduleResponse["defaults"]
): number {
  if (slot.available_persons != null && Number.isFinite(slot.available_persons) && slot.available_persons >= 0) {
    return slot.available_persons;
  }

  const fromDefaults = defaults?.available_persons;
  if (fromDefaults != null && Number.isFinite(fromDefaults) && fromDefaults >= 0) {
    return fromDefaults;
  }

  return 12;
}

export function mapScheduleToPartnerDates(
  schedule: TripsterScheduleResponse,
  durationDays: number,
  priceCurrency?: string | null
): TourDatePrice[] {
  const dates: TourDatePrice[] = [];
  const scheduleMap = schedule.schedule ?? {};
  const currency = priceCurrency?.trim().toUpperCase() || undefined;

  for (const startDate of Object.keys(scheduleMap).sort()) {
    const slots = scheduleMap[startDate] ?? [];
    for (const slot of slots) {
      const time = slot.time?.trim() || slot.time_start?.trim() || "08:00";
      let endDate = startDate;
      try {
        endDate = format(addDays(parseISO(startDate), Math.max(1, durationDays) - 1), "yyyy-MM-dd");
      } catch {
        endDate = startDate;
      }

      const slotValue = slot.price?.price_value;
      const hasSlotPrice = slotValue != null && Number.isFinite(slotValue);

      dates.push({
        id: `tripster-${startDate}-${time}`,
        startDate,
        endDate,
        spotsLeft: resolveScheduleSlotSpotsLeft(slot, schedule.defaults),
        priceUsd: hasSlotPrice && currency === "USD" ? slotValue : 0,
        partnerPriceValue: hasSlotPrice ? slotValue : undefined,
        partnerPriceCurrency: hasSlotPrice ? currency : undefined,
      });
    }
  }

  return dates;
}

export function buildPartnerImportantInfo(content: PartnerTourContent): string[] {
  const items: string[] = [];

  if (content.scheduleText?.trim()) {
    items.push(content.scheduleText.trim());
  }

  if (content.priceDescription?.trim()) {
    items.push(content.priceDescription.trim());
  }

  if (content.additionalInfoHtml?.trim()) {
    const plain = htmlToPlainText(content.additionalInfoHtml).trim();
    if (plain) items.push(plain);
  }

  return items;
}
