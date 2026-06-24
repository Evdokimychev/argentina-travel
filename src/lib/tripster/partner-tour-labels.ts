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

/** Является ли текст ограничением по возрасту группы, а не политикой «можно с детьми». */
export function isPartnerAgeRangeSummary(summary: string): boolean {
  const value = summary.trim();
  if (!value) return false;
  if (value === "Только взрослые") return true;
  if (/^\d+[–-]\d+\s*лет$/u.test(value)) return true;
  if (/^От\s+\d+\s+лет$/u.test(value)) return true;
  return false;
}

export type PartnerAgeChipMeta = {
  label: "Возраст" | "Дети";
  value: string;
  kind: "age" | "children";
};

/** Подпись и значение чипа: возрастной диапазон группы или политика по детям. */
export function resolvePartnerAgeChipMeta(input: {
  childrenSummary?: string;
  childFriendly?: boolean;
}): PartnerAgeChipMeta {
  const summary = input.childrenSummary?.trim();
  if (summary && isPartnerAgeRangeSummary(summary)) {
    return { label: "Возраст", value: summary, kind: "age" };
  }

  return {
    label: "Дети",
    value: summary || formatPartnerChildrenSummary(input.childFriendly),
    kind: "children",
  };
}

function formatPartnerLanguageName(primary: string): string {
  const lower = primary.trim().toLowerCase();
  if (!lower) return primary;
  if (lower.includes("рус") || lower === "ru" || lower === "russian") return "Русский";
  if (lower.includes("англ") || lower === "en" || lower === "english") return "Английский";
  if (lower.includes("исп") || lower === "es" || lower === "spanish") return "Испанский";
  if (lower.includes("порту") || lower === "pt" || lower === "portuguese") return "Португальский";
  if (lower.includes("фран") || lower === "fr" || lower === "french") return "Французский";
  if (lower.includes("нем") || lower === "de" || lower === "german") return "Немецкий";
  if (lower.includes("итал") || lower === "it" || lower === "italian") return "Итальянский";
  return primary.charAt(0).toUpperCase() + primary.slice(1);
}

/** Все языки тура через запятую — как на YouTravel.me. */
export function formatPartnerLanguagesList(languages?: string[]): string | undefined {
  const normalized = (languages ?? [])
    .map((item) => item.trim())
    .filter(Boolean)
    .map(formatPartnerLanguageName);

  if (!normalized.length) return undefined;
  return [...new Set(normalized)].join(", ");
}

/** Язык проведения — «На русском языке» и т.п. */
export function formatPartnerLanguageSummary(languages?: string[]): string {
  const list = formatPartnerLanguagesList(languages);
  if (!list) return "На русском языке";

  const names = list.split(", ").filter(Boolean);
  if (names.length === 1) {
    const name = names[0]!;
    if (name === "Русский") return "На русском языке";
    if (name === "Английский") return "На английском языке";
    if (name === "Испанский") return "На испанском языке";
    return `На ${name.toLowerCase()} языке`;
  }

  return list;
}
