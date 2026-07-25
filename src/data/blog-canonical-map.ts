/**
 * Канонические пары: шаблон Класса B (noindex) → indexable pillar.
 * @see docs/blog-canonical-map.md
 */
export type BlogCanonicalTarget = {
  canonicalSlug: string;
  canonicalTitle: string;
};

/** Точное совпадение slug */
export const BLOG_CANONICAL_BY_SLUG: Record<string, BlogCanonicalTarget> = {
  "food-asado": {
    canonicalSlug: "argentinian-steak-guide",
    canonicalTitle: "Аргентинские стейки: отрубы, прожарка и как заказать в parrilla",
  },
  "wine-malbec": {
    canonicalSlug: "food-malbec",
    canonicalTitle: "Malbec в Аргентине: от винодельни до бокала",
  },
  "relocation-visa-free": {
    canonicalSlug: "argentina-tourist-visa-2026",
    canonicalTitle: "Въезд туриста в Аргентину: виза, сроки и документы",
  },
  "trekking-чек-лист": {
    canonicalSlug: "patagonia-packing-list",
    canonicalTitle: "Что взять в Патагонию: полный список вещей для путешествия",
  },
  "patagonia-за-14-дней": {
    canonicalSlug: "patagoniya-marshrut-14-dney",
    canonicalTitle: "Патагония за 14 дней: ледники, Фицрой и Ушуая",
  },
};

/** Префикс slug → канон (районы BA, северо-запад) */
const BLOG_CANONICAL_PREFIXES: Array<{ prefix: string } & BlogCanonicalTarget> = [
  {
    prefix: "ba-district-",
    canonicalSlug: "buenos-aires-rajony",
    canonicalTitle: "Буэнос-Айрес: гид по районам — где жить и останавливаться",
  },
  {
    prefix: "northwest-",
    canonicalSlug: "salta-i-severo-zapad-marshrut",
    canonicalTitle: "Сальта и северо-запад: маршрут на 5–7 дней",
  },
];

export function resolveBlogCanonicalTarget(slug: string): BlogCanonicalTarget | undefined {
  const exact = BLOG_CANONICAL_BY_SLUG[slug];
  if (exact) return exact;

  for (const entry of BLOG_CANONICAL_PREFIXES) {
    if (slug.startsWith(entry.prefix)) {
      return {
        canonicalSlug: entry.canonicalSlug,
        canonicalTitle: entry.canonicalTitle,
      };
    }
  }

  return undefined;
}

export function buildCanonicalCtaParagraph(target: BlogCanonicalTarget): string {
  return (
    `Эта тема подробно разобрана в основной статье ` +
    `«${target.canonicalTitle}»: /blog/${target.canonicalSlug}.`
  );
}

/** 8 секционных pillar-slug для блока «С чего начать» (без rich-нацпарков). */
export const BLOG_START_HERE_SLUGS: readonly string[] = [
  "best-time-to-visit-argentina",
  "buenos-aires-rajony",
  "patagonia-packing-list",
  "argentinian-steak-guide",
  "mendoza-vinnyj-gid",
  "tango-beginners-guide",
  "salta-i-severo-zapad-marshrut",
  "el-chalten-i-fitts-roy",
] as const;
