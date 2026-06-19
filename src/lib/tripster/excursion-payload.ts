import { sanitizeHtml } from "@/lib/rich-text";
import type { TripsterExperience } from "@/lib/tripster/types";
import type {
  ExcursionDescriptionBlock,
  ExcursionGuide,
  ExcursionLocationPoint,
  ExcursionTicketOption,
} from "@/types/excursion";

export type ParsedExcursionPayload = {
  guide?: ExcursionGuide;
  descriptionBlocks: ExcursionDescriptionBlock[];
  meetingPoint?: ExcursionLocationPoint;
  finishPoint?: ExcursionLocationPoint;
  priceIncluded?: string;
  priceExcluded?: string;
  comfortLevelInfo?: string;
  movementType?: string;
  isBookable: boolean;
  visitorsCount?: number;
  ticketOptions: ExcursionTicketOption[];
  priceDescription?: string;
  coverImage?: string;
};

function parseLocationPoint(raw: unknown): ExcursionLocationPoint | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const point = raw as { text?: string | null; address?: string | null; description?: string | null };
  const text = point.text?.trim() || point.address?.trim() || point.description?.trim();
  if (!text) return undefined;
  return { text };
}

function parseDescriptionBlocks(raw: unknown): ExcursionDescriptionBlock[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((block): block is unknown[] => Array.isArray(block) && block.length >= 2)
    .map(([title, html]) => ({
      title: String(title ?? "").trim(),
      html: sanitizeHtml(String(html ?? "")),
    }))
    .filter((block) => block.html.length > 0);
}

function parseTicketOptions(experience: TripsterExperience): ExcursionTicketOption[] {
  const perPerson = experience.price?.per_person;
  if (!Array.isArray(perPerson) || perPerson.length === 0) return [];

  return perPerson.map((ticket) => ({
    id: ticket.id,
    title: ticket.title?.trim() || "Участник",
    isDefault: ticket.is_default ?? false,
    value: ticket.value,
  }));
}

export function parseExcursionPayload(payload: unknown): ParsedExcursionPayload {
  const experience = payload as TripsterExperience | null | undefined;
  if (!experience) {
    return {
      descriptionBlocks: [],
      ticketOptions: [],
      isBookable: false,
    };
  }

  const guideRaw = experience.guide;
  const guide: ExcursionGuide | undefined =
    guideRaw && typeof guideRaw.id === "number"
      ? {
          id: guideRaw.id,
          name: (() => {
            const raw = guideRaw.first_name?.trim() || "Гид";
            return raw.charAt(0).toUpperCase() + raw.slice(1);
          })(),
          url: guideRaw.url,
          avatar:
            guideRaw.avatar?.medium ||
            guideRaw.avatar?.small ||
            guideRaw.avatar?.original,
        }
      : undefined;

  return {
    guide,
    descriptionBlocks: parseDescriptionBlocks(experience.description_blocks),
    meetingPoint: parseLocationPoint(experience.meeting_point),
    finishPoint: parseLocationPoint(experience.finish_point),
    priceIncluded: experience.price_included_description?.trim() || undefined,
    priceExcluded: experience.price_not_included_description?.trim() || undefined,
    comfortLevelInfo: experience.comfort_level_info?.trim() || undefined,
    movementType: experience.movement_type?.trim() || undefined,
    isBookable: experience.is_bookable !== false,
    visitorsCount: experience.visitors_count,
    ticketOptions: parseTicketOptions(experience),
    priceDescription: experience.price?.price_description?.trim() || undefined,
    coverImage: experience.cover_image?.trim() || undefined,
  };
}
