export type ExcursionPartner = "tripster" | "sputnik8" | "youtravel";

export type ParsedExcursionSlug = {
  partner: ExcursionPartner;
  id: number;
  slug: string;
};

const TRIPSTER_SUFFIX = /-t(\d+)$/i;
const SPUTNIK8_SUFFIX = /-s(\d+)$/i;
const YOUTRAVEL_SUFFIX = /-yt(\d+)$/i;

export function parseExcursionSlug(slug: string): ParsedExcursionSlug | null {
  const normalized = slug?.trim();
  if (!normalized) return null;

  const youtravelMatch = normalized.match(YOUTRAVEL_SUFFIX);
  if (youtravelMatch) {
    const id = Number.parseInt(youtravelMatch[1], 10);
    if (Number.isFinite(id)) {
      return { partner: "youtravel", id, slug: normalized };
    }
  }

  const sputnikMatch = normalized.match(SPUTNIK8_SUFFIX);
  if (sputnikMatch) {
    const id = Number.parseInt(sputnikMatch[1], 10);
    if (Number.isFinite(id)) {
      return { partner: "sputnik8", id, slug: normalized };
    }
  }

  const tripsterMatch = normalized.match(TRIPSTER_SUFFIX);
  if (tripsterMatch) {
    const id = Number.parseInt(tripsterMatch[1], 10);
    if (Number.isFinite(id)) {
      return { partner: "tripster", id, slug: normalized };
    }
  }

  return null;
}

export function generateSputnik8ExperienceSlug(title: string, productId: number): string {
  const base = slugifyExcursionTitle(title);
  return `${base}-s${productId}`;
}

export function generateTripsterExperienceSlug(title: string, experienceId: number): string {
  const base = slugifyExcursionTitle(title);
  return `${base}-t${experienceId}`;
}

function slugifyExcursionTitle(title: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i",
    й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
    у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "",
    э: "e", ю: "yu", я: "ya",
  };

  const normalized = title
    .trim()
    .toLowerCase()
    .split("")
    .map((char) => map[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return normalized || "excursion";
}
