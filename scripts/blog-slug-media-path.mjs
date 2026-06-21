/**
 * Blog slug → latinized folder under public/media/blog/.
 * Cyrillic URL slugs use filesystem-safe paths (see iguazu-za-3-dnya, money-karty).
 */

const CYRILLIC_TO_LATIN = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

/** Explicit overrides where auto-transliteration differs from legacy folders. */
export const BLOG_SLUG_MEDIA_FOLDER = {
  "money-карты": "money-karty",
  "patagonia-авиабилеты": "patagonia-aviabilety",
  "patagonia-автобусы": "patagonia-avtobusy",
  "patagonia-аренда-авто": "patagonia-arenda-avto",
  "patagonia-отели": "patagonia-oteli",
  "iguazu-за-3-дня": "iguazu-za-3-dnya",
  "itinerary-за-10-дней": "itinerary-za-10-dney",
  "itinerary-за-14-дней": "itinerary-za-14-dney",
  "itinerary-ошибки": "itinerary-oshibki",
  "itinerary-чек-лист": "itinerary-chek-list",
  "wildlife-с-гидом": "wildlife-s-gidom",
};

function transliterateChar(char) {
  const lower = char.toLowerCase();
  const mapped = CYRILLIC_TO_LATIN[lower];
  if (mapped !== undefined) return mapped;
  if (/[a-z0-9-]/.test(char)) return char.toLowerCase();
  return "-";
}

/** @param {string} slug */
export function blogMediaFolder(slug) {
  if (BLOG_SLUG_MEDIA_FOLDER[slug]) return BLOG_SLUG_MEDIA_FOLDER[slug];
  if (!/[а-яё]/i.test(slug)) return slug;

  const parts = slug.split("-");
  const out = parts
    .map((part) =>
      [...part]
        .map(transliterateChar)
        .join("")
        .replace(/-+/g, ""),
    )
    .filter(Boolean);

  return out.join("-").replace(/-+/g, "-");
}

/** @param {string} slug */
export function blogHeroLocalPath(slug) {
  return `media/blog/${blogMediaFolder(slug)}/hero.jpg`;
}
