import type { YouTravelTour } from "@/lib/youtravel/types";

/** Максимум тематических меток в listing (каталог / деталь). */
export const YOUTRAVEL_THEMATIC_TAG_LIMIT = 4;

/** Сколько дополнительных меток показывать на карточке каталога (кроме основной). */
export const YOUTRAVEL_CATALOG_THEMATIC_TAG_LIMIT = 3;

/** Каталожные и навигационные метки — не характеристики конкретного тура. */
const GENERIC_TAG_PATTERNS: RegExp[] = [
  /^youtravel/i,
  /^партнёр/i,
  /^все$/i,
  /^(осенью|зимой|летом|весной)$/i,
  /^экскурсионные туры$/i,
  /^обзорные$/i,
  /^тематические$/i,
  /^авторские$/i,
  /^уникальный опыт$/i,
  /^группов(ая|ые)$/i,
  /^индивидуальные$/i,
  /^для детей$/i,
  /^моментальное бронирование$/i,
  /^мгновенная бронь$/i,
];

function isGenericTag(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return true;
  return GENERIC_TAG_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function extractTypeLabel(item: string | { title?: string; main?: boolean }): string | null {
  if (typeof item === "string") {
    const trimmed = item.trim();
    return trimmed || null;
  }
  const title = item.title?.trim();
  return title || null;
}

/** API иногда отдаёт несколько категорий одной строкой через запятую. */
export function expandYouTravelTagLabels(raw: string): string[] {
  return raw
    .split(/[,;]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function pushLabels(
  target: string[],
  raw: string | null | undefined,
): void {
  if (!raw?.trim()) return;
  for (const label of expandYouTravelTagLabels(raw)) {
    target.push(label);
  }
}

function collectCandidates(payload: YouTravelTour): { priority: string[]; rest: string[] } {
  const priority: string[] = [];
  const rest: string[] = [];

  pushLabels(priority, payload.main_type?.trim());

  if (Array.isArray(payload.types)) {
    for (const item of payload.types) {
      if (typeof item === "object" && item != null && item.main === true) {
        pushLabels(priority, extractTypeLabel(item));
      }
    }
    for (const item of payload.types) {
      if (typeof item === "object" && item != null && item.main === true) continue;
      pushLabels(rest, extractTypeLabel(item));
    }
  }

  pushLabels(rest, payload.activityType?.trim());
  pushLabels(rest, payload.type?.trim());

  if (Array.isArray(payload.tags)) {
    for (const tag of payload.tags) {
      if (typeof tag === "string") pushLabels(rest, tag);
    }
  }

  return { priority, rest };
}

function dedupeTags(labels: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const candidate of labels) {
    const label = candidate.trim();
    if (!label) continue;

    const lower = label.toLowerCase();
    if (seen.has(lower)) continue;
    if (isGenericTag(label)) continue;

    seen.add(lower);
    result.push(label);
    if (result.length >= YOUTRAVEL_THEMATIC_TAG_LIMIT) break;
  }

  return result;
}

/** Тематические метки из types / tags / main_type — основная первая, без дублей, до 4. */
export function resolveYouTravelThematicTags(payload: YouTravelTour): string[] {
  const { priority, rest } = collectCandidates(payload);
  return dedupeTags([...priority, ...rest]);
}

export type YouTravelThematicTagSet = {
  mainTag: string | null;
  otherTags: string[];
};

/** Основная категория + остальные — для карточки каталога. */
export function resolveYouTravelThematicTagSet(payload: YouTravelTour): YouTravelThematicTagSet {
  const tags = resolveYouTravelThematicTags(payload);
  if (!tags.length) {
    return { mainTag: null, otherTags: [] };
  }

  return {
    mainTag: tags[0] ?? null,
    otherTags: tags.slice(1, YOUTRAVEL_CATALOG_THEMATIC_TAG_LIMIT + 1),
  };
}
