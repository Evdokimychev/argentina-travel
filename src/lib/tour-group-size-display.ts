import type { TourListing } from "@/types";
import { pluralRu } from "@/lib/pluralize";

function peopleWord(count: number): string {
  return pluralRu(count, "человека", "человека", "человек");
}

/** Подпись размера группы для карточки каталога — из фактических min/max тура. */
export function formatTourGroupSizeLabel(
  tour: Pick<TourListing, "groupSizeMin" | "groupSizeMax" | "groupSizeBucket">,
): string {
  const min = Math.max(1, tour.groupSizeMin || 1);
  const max = Math.max(min, tour.groupSizeMax || min);

  if (max <= 1) return "Индивидуально";

  if (min > 1 && min < max) {
    return `${min}–${max} ${peopleWord(max)}`;
  }

  return `До ${max} ${peopleWord(max)}`;
}
