import {
  BedDouble,
  Bus,
  CircleHelp,
  Plane,
  Shield,
  Ship,
  Ticket,
  UserRound,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export const TOUR_TERM_DETAIL_DELIMITER = " :: ";
export const ORGANIZER_TOUR_TERMS_ITEM_DETAIL_MAX = 400;

export interface ParsedTourTermItem {
  title: string;
  detail?: string;
}

export function parseTourTermItem(raw: string): ParsedTourTermItem {
  const trimmed = raw.trim();
  if (!trimmed) return { title: "" };

  const delimiterIndex = trimmed.indexOf(TOUR_TERM_DETAIL_DELIMITER);
  if (delimiterIndex === -1) {
    return { title: trimmed };
  }

  const title = trimmed.slice(0, delimiterIndex).trim();
  const detail = trimmed.slice(delimiterIndex + TOUR_TERM_DETAIL_DELIMITER.length).trim();
  return {
    title: title || trimmed,
    detail: detail || undefined,
  };
}

export function serializeTourTermItem(item: ParsedTourTermItem): string {
  const title = item.title.trim();
  const detail = item.detail?.trim();
  if (!title) return "";
  if (!detail) return title;
  return `${title}${TOUR_TERM_DETAIL_DELIMITER}${detail}`;
}

export function parseTourTermItems(items: string[]): ParsedTourTermItem[] {
  return items.map(parseTourTermItem).filter((item) => item.title.trim());
}

export function serializeTourTermItems(items: ParsedTourTermItem[]): string[] {
  return items.map(serializeTourTermItem).filter(Boolean);
}

export function inferIncludedTermIcon(title: string): LucideIcon {
  const normalized = title.toLowerCase();
  if (/прожив|отел|lodge|ноч/.test(normalized)) return BedDouble;
  if (/завтрак|обед|ужин|питан|meal|food/.test(normalized)) return UtensilsCrossed;
  if (/перел|авиа|рейс|flight/.test(normalized)) return Plane;
  if (/трансф|transfer|автоб/.test(normalized)) return Bus;
  if (/гид|guide|сопров/.test(normalized)) return UserRound;
  if (/билет|парк|вход|ticket/.test(normalized)) return Ticket;
  if (/круиз|cruise|катер|лодк/.test(normalized)) return Ship;
  if (/страх/.test(normalized)) return Shield;
  return CircleHelp;
}

export function inferExcludedTermIcon(title: string): LucideIcon {
  const normalized = title.toLowerCase();
  if (/авиа|перел|билет/.test(normalized)) return Plane;
  if (/страх/.test(normalized)) return Shield;
  if (/ужин|обед|завтрак|питан/.test(normalized)) return UtensilsCrossed;
  if (/сувенир|личн|расход/.test(normalized)) return CircleHelp;
  return CircleHelp;
}
