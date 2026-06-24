import { sanitizeHtml } from "@/lib/rich-text";
import type { TripsterExperience } from "@/lib/tripster/types";
import type {
  PartnerTourContent,
  PartnerTourOrgDetailItem,
} from "@/lib/tripster/partner-tour-content";
import type { ComfortLevel, TourAccommodation, TourItineraryDay } from "@/types";
import { htmlToPlainText } from "@/lib/rich-text";

export type PartnerTourOvernightStop = {
  location: string;
  nights: number;
};

const ACCOMMODATION_TITLE_PATTERN = /^проживан/i;
const OVERNIGHT_PATTERN = /ноч[ёе]вк[аи][^<.]*/gi;

export function isPartnerAccommodationTitle(title: string): boolean {
  return ACCOMMODATION_TITLE_PATTERN.test(title.trim());
}

function extractImageUrlsFromHtml(html: string): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  const pattern = /<img[^>]+src=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html))) {
    const url = match[1]?.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
  }
  return urls;
}

function resolveComfortFromHtml(html: string): ComfortLevel {
  const plain = htmlToPlainText(html);
  if (/5\s*★|5\s*\*|пят/i.test(plain)) return "Премиум";
  if (/4\s*★|4\s*\*/i.test(plain)) return "Комфорт";
  if (/3\s*★|3\s*\*/i.test(plain)) return "Стандарт";
  if (/премиум/i.test(plain)) return "Премиум";
  if (/стандарт/i.test(plain)) return "Стандарт";
  return "Стандарт";
}

function parseAccommodationItemHtml(html: string, fallbackTitle: string): PartnerTourOrgDetailItem[] {
  const sanitized = sanitizeHtml(html).trim();
  if (!sanitized) return [];

  const headingPattern =
    /<(?:h[2-4]|p)[^>]*>\s*(?:<(?:strong|b)>)?\s*([^<]{3,120})(?:<\/(?:strong|b)>)?\s*<\/(?:h[2-4]|p)>/gi;
  const matches: Array<{ title: string; start: number; end: number }> = [];
  let match: RegExpExecArray | null;

  while ((match = headingPattern.exec(sanitized))) {
    const title = match[1]?.replace(/[.:]+\s*$/, "").trim();
    if (!title || ACCOMMODATION_TITLE_PATTERN.test(title)) continue;
    matches.push({ title, start: match.index, end: match.index + match[0].length });
  }

  if (matches.length === 0) {
    return [{ title: fallbackTitle, html: sanitized }];
  }

  const intro = sanitized.slice(0, matches[0].start).trim();
  const items: PartnerTourOrgDetailItem[] = [];
  if (intro) {
    items.push({ title: "Общая информация", html: intro });
  }

  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const nextStart = matches[index + 1]?.start ?? sanitized.length;
    const itemHtml = sanitized.slice(current.end, nextStart).trim();
    if (!itemHtml) continue;
    items.push({ title: current.title, html: itemHtml });
  }

  return items;
}

export function splitPartnerLodgingFromOrgDetails(
  items: PartnerTourOrgDetailItem[]
): {
  orgDetailsItems: PartnerTourOrgDetailItem[];
  accommodationItems: PartnerTourOrgDetailItem[];
} {
  const orgDetailsItems: PartnerTourOrgDetailItem[] = [];
  const accommodationItems: PartnerTourOrgDetailItem[] = [];

  for (const item of items) {
    if (isPartnerAccommodationTitle(item.title)) {
      accommodationItems.push(...parseAccommodationItemHtml(item.html, item.title));
    } else {
      orgDetailsItems.push(item);
    }
  }

  return { orgDetailsItems, accommodationItems };
}

export function extractOvernightStops(itinerary: TourItineraryDay[]): PartnerTourOvernightStop[] {
  const counts = new Map<string, number>();

  for (const day of itinerary) {
    const source = `${day.descriptionHtml ?? ""}\n${day.description ?? ""}`;
    OVERNIGHT_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = OVERNIGHT_PATTERN.exec(source))) {
      const raw = match[0]
        .replace(/^ноч[ёе]вк[аи]\s*(?:в|на)\s*/i, "")
        .replace(/[.!?\s]+$/g, "")
        .trim();
      if (!raw || raw.length < 2) continue;
      counts.set(raw, (counts.get(raw) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([location, nights]) => ({ location, nights }))
    .sort((a, b) => b.nights - a.nights || a.location.localeCompare(b.location, "ru"));
}

function buildLodgingNotes(experience: TripsterExperience): string[] {
  const notes: string[] = [];
  const included = htmlToPlainText(experience.price_included_description ?? "");
  const excluded = htmlToPlainText(experience.price_not_included_description ?? "");
  const annotation = experience.annotation?.trim() ?? "";

  if (/прожив/i.test(included)) {
    notes.push("Проживание включено в стоимость тура.");
  }
  if (/1[-–—]?местн/i.test(excluded)) {
    notes.push("Одноместное размещение оплачивается дополнительно — уточняйте сумму у организатора.");
  }
  if (/подселен/i.test(`${excluded} ${annotation}`)) {
    notes.push("Возможно подселение или одноместное размещение за доплату.");
  }
  if (/отел|гостин|размещ/i.test(annotation) && !notes.some((note) => /отел|размещ/i.test(note))) {
    const sentence = annotation
      .split(/(?<=[.!?])\s+/)
      .find((part) => /отел|гостин|размещ/i.test(part));
    if (sentence) notes.push(sentence.trim());
  }

  return notes;
}

export function mapPartnerAccommodations(
  content: Pick<
    PartnerTourContent,
    "accommodationIntroHtml" | "accommodationItems" | "accommodationOvernights"
  >
): TourAccommodation[] {
  const accommodations: TourAccommodation[] = [];

  for (const [index, item] of (content.accommodationItems ?? []).entries()) {
    const images = extractImageUrlsFromHtml(item.html);
    accommodations.push({
      id: `tripster-lodging-${index + 1}`,
      name: item.title,
      description: item.html,
      comfort: resolveComfortFromHtml(item.html),
      accommodationType: "Отель",
      amenities: [],
      images,
      fullPeriod: false,
    });
  }

  for (const [index, stop] of (content.accommodationOvernights ?? []).entries()) {
    accommodations.push({
      id: `tripster-overnight-${index + 1}`,
      name: stop.location,
      description: `<p>Ночёвка по программе тура${stop.nights > 1 ? ` — ${stop.nights} ${stop.nights >= 5 ? "ночей" : stop.nights === 1 ? "ночь" : "ночи"}` : ""}.</p>`,
      comfort: "Стандарт",
      accommodationType: "Отель",
      amenities: [],
      images: [],
      nights: stop.nights,
      fullPeriod: false,
    });
  }

  return accommodations;
}

export function finalizePartnerLodging(
  content: PartnerTourContent,
  experience: TripsterExperience,
  itinerary: TourItineraryDay[] = []
): PartnerTourContent {
  const lodgingNotes = buildLodgingNotes(experience);
  const overnights = extractOvernightStops(itinerary);

  const introParts = [
    content.accommodationIntroHtml?.trim(),
    lodgingNotes.length
      ? `<ul>${lodgingNotes.map((note) => `<li>${note}</li>`).join("")}</ul>`
      : "",
  ].filter(Boolean);

  return {
    ...content,
    accommodationIntroHtml: introParts.length ? sanitizeHtml(introParts.join("")) : content.accommodationIntroHtml,
    accommodationOvernights: overnights.length ? overnights : content.accommodationOvernights,
  };
}

export function partnerContentHasAccommodation(
  content: PartnerTourContent,
  durationNights: number
): boolean {
  if (durationNights <= 0) return false;
  return Boolean(
    content.accommodationIntroHtml?.trim() ||
      content.accommodationItems?.length ||
      content.accommodationOvernights?.length ||
      content.accommodationHtml?.trim() ||
      content.accommodationTypesSummary?.trim() ||
      content.accommodationPhotos?.length ||
      content.accommodationRoomTypes?.length ||
      content.comfortLevel != null ||
      content.comfortDescription?.trim() ||
      htmlToPlainText(content.includedHtml ?? "").includes("Проживание")
  );
}
