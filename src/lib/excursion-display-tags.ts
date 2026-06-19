import type { ExcursionTag } from "@/types/excursion";

/** Лимит тематических тегов на карточке экскурсии (без служебных чипов). */
export const EXCURSION_DETAIL_TAG_LIMIT = 4;

/** Каталожные и навигационные теги Tripster — не характеристики конкретной экскурсии. */
const EXCURSION_GENERIC_TAG_PATTERNS: RegExp[] = [
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
  /^экскурсии на .+ языке$/i,
  /^пожить как местный$/i,
  /^история и архитектура$/i,
  /^музеи и искусство$/i,
  /^за городом( и природа)?$/i,
  /^активности$/i,
  /^гастрономические$/i,
  /^увидеть главное$/i,
  /^парки$/i,
  /^набережные$/i,
  /^переулки и улицы$/i,
  /^усадьбы и дворцы$/i,
  /^монастыри, церкви, храмы$/i,
  /^необычные дома$/i,
  /^\d+\+?\s*путешествен/i,
  /^моментальное бронирование$/i,
  /^подходит для детей$/i,
];

export function isExcursionCatalogTag(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return true;
  return EXCURSION_GENERIC_TAG_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function filterExcursionDisplayTags(
  tags: ExcursionTag[],
  options?: {
    existingLabels?: string[];
    childFriendly?: boolean;
  }
): ExcursionTag[] {
  const existing = new Set(
    (options?.existingLabels ?? []).map((label) => label.trim().toLowerCase())
  );

  const filtered: ExcursionTag[] = [];
  const seen = new Set<string>();

  for (const tag of tags) {
    const name = tag.name.trim();
    if (!name) continue;

    const lower = name.toLowerCase();
    if (existing.has(lower) || seen.has(lower)) continue;
    if (options?.childFriendly && lower === "для детей") continue;
    if (isExcursionCatalogTag(name)) continue;

    seen.add(lower);
    filtered.push({ ...tag, name });
    if (filtered.length >= EXCURSION_DETAIL_TAG_LIMIT) break;
  }

  return filtered;
}
