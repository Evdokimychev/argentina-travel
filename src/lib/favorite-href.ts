import type { FavoriteTour } from "@/types/tourist";

export function favoriteHref(favorite: FavoriteTour): string {
  const kind = favorite.kind ?? "tour";
  if (kind === "excursion") return `/excursions/${favorite.tourSlug}`;
  if (kind === "place") return `/places/${favorite.tourSlug}`;
  return `/tours/${favorite.tourSlug}`;
}
