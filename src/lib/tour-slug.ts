import type { OrganizerTourDraft, OrganizerTourListing } from "@/types/organizer-tour";

/** Public catalog URL slug for an organizer tour. */
export function getCatalogSlug(
  tour: Pick<OrganizerTourListing, "slug" | "catalogSlug">
): string {
  return tour.catalogSlug?.trim() || tour.slug.trim();
}

function transliterateForSlug(value: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i",
    й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
    у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "",
    э: "e", ю: "yu", я: "ya",
  };

  return value
    .toLowerCase()
    .split("")
    .map((char) => map[char] ?? char)
    .join("");
}

export function slugifyTourTitle(title: string): string {
  const normalized = transliterateForSlug(title.trim().toLowerCase())
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return normalized || "tour";
}

export function generateUniqueTourSlug(title: string, takenSlugs: Set<string>): string {
  const base = slugifyTourTitle(title);
  if (!takenSlugs.has(base)) return base;

  let index = 2;
  while (takenSlugs.has(`${base}-${index}`)) {
    index += 1;
  }
  return `${base}-${index}`;
}

export function collectTakenCatalogSlugs(
  organizerListings: OrganizerTourListing[],
  marketplaceSlugs: string[]
): Set<string> {
  const taken = new Set<string>(marketplaceSlugs);
  for (const listing of organizerListings) {
    taken.add(getCatalogSlug(listing));
  }
  return taken;
}

export function createOrganizerTourId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `org-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `org-${Date.now().toString(36)}`;
}
