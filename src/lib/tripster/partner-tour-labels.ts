/**
 * Tripster exposes `format` and `movement_type` as raw lowercase enum slugs
 * (e.g. "activity", "car"). Rendering them verbatim leaks technical tokens into
 * the UI, so map the known ones to Russian labels and humanize the rest as a
 * fallback (so an unmapped value reads "Public transport", never "public_transport").
 */

const FORMAT_LABELS: Record<string, string> = {
  activity: "Активный отдых",
  tour: "Многодневный тур",
  excursion: "Экскурсия",
  walk: "Пешеходная прогулка",
  show: "Шоу",
  masterclass: "Мастер-класс",
  individual: "Индивидуальный",
  group: "Групповой",
  group_tour: "Групповой тур",
  private: "Индивидуальный",
};

const MOVEMENT_LABELS: Record<string, string> = {
  walk: "Пешком",
  foot: "Пешком",
  car: "На автомобиле",
  auto: "На автомобиле",
  bus: "На автобусе",
  minibus: "На микроавтобусе",
  bike: "На велосипеде",
  bicycle: "На велосипеде",
  boat: "На катере",
  ship: "На катере",
  public_transport: "На общественном транспорте",
  mixed: "Комбинированное",
};

function humanize(value: string): string {
  const cleaned = value.replace(/[_-]+/g, " ").trim();
  if (!cleaned) return value;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function resolveLabel(value: string | undefined, map: Record<string, string>): string | undefined {
  const raw = value?.trim();
  if (!raw) return undefined;
  return map[raw.toLowerCase()] ?? humanize(raw);
}

export function formatPartnerFormatLabel(value: string | undefined): string | undefined {
  return resolveLabel(value, FORMAT_LABELS);
}

export function formatPartnerMovementLabel(value: string | undefined): string | undefined {
  const raw = value?.trim().toLowerCase();
  if (!raw || raw === "other") return undefined;
  return resolveLabel(value, MOVEMENT_LABELS);
}

import { peopleWord } from "@/lib/pluralize";

/** «До 12 человек» — как на карточке тура Tripster. */
export function formatPartnerMaxGroupLabel(maxPersons: number): string {
  const max = Math.max(1, Math.floor(maxPersons));
  return `До ${max.toLocaleString("ru-RU")} ${peopleWord(max)}`;
}

/** Политика по детям с витрины Tripster (`child_friendly`). */
export function formatPartnerChildrenSummary(childFriendly?: boolean): string {
  return childFriendly ? "Можно с детьми" : "Нельзя с детьми";
}

/** Язык проведения — «На русском языке» и т.п. */
export function formatPartnerLanguageSummary(languages?: string[]): string {
  const primary = languages?.[0]?.trim();
  if (!primary) return "На русском языке";

  const lower = primary.toLowerCase();
  if (lower.includes("рус") || lower === "ru" || lower === "russian") {
    return "На русском языке";
  }
  if (lower.includes("англ") || lower === "en" || lower === "english") {
    return "На английском языке";
  }
  if (lower.includes("исп") || lower === "es" || lower === "spanish") {
    return "На испанском языке";
  }

  return `На ${primary.toLowerCase()} языке`;
}
