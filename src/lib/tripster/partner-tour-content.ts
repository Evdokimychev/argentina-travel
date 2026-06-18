import { addDays, format, parseISO } from "date-fns";
import { parseExcursionPayload } from "@/lib/tripster/excursion-payload";
import { mapPhotos } from "@/lib/tripster/mapper";
import type {
  TripsterExperience,
  TripsterScheduleResponse,
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

export function isPartnerOrgDetailsBlockTitle(title: string): boolean {
  return ORG_DETAILS_TITLE_PATTERN.test(title.trim());
}

/** Tripster хранит пункты аккордеона «Организационные детали» в comfort_level_info. */
export function parseComfortLevelOrgDetails(html: string): PartnerTourOrgDetailItem[] {
  const sanitized = sanitizeHtml(html);
  const items: PartnerTourOrgDetailItem[] = [];
  const pattern = /<p>\s*<strong>([^<]+?)<\/strong>\s*([\s\S]*?)<\/p>/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(sanitized))) {
    const title = match[1]?.replace(/\.$/, "").trim();
    const body = match[2]?.trim();
    if (!title || !body) continue;
    items.push({
      title,
      html: sanitizeHtml(`<p>${body}</p>`),
    });
  }

  return items;
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

  for (const block of parsed.descriptionBlocks) {
    if (!block.title || !block.html) continue;
    if (isPartnerOrgDetailsBlockTitle(block.title)) {
      orgDetailsIntroHtml = block.html;
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
  const orgDetailsItems = comfortSanitized
    ? parseComfortLevelOrgDetails(comfortSanitized)
    : [];
  const orgDetailsExtraHtml =
    comfortSanitized && orgDetailsItems.length === 0 ? comfortSanitized : undefined;

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
    comfortHtml: orgDetailsItems.length || orgDetailsExtraHtml ? undefined : comfortSanitized,
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
        spotsLeft: schedule.defaults?.available_persons ?? 12,
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

  return items;
}
