"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";
import { useFavoriteTour } from "@/hooks/useFavoriteTour";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import type { ExcursionListing } from "@/types/excursion";

export default function ExcursionFavoriteButton({
  excursion,
  className,
  iconClassName,
}: {
  excursion: Pick<
    ExcursionListing,
    "id" | "slug" | "title" | "coverImage" | "cityName" | "priceValue"
  >;
  className?: string;
  iconClassName?: string;
}) {
  const { t } = useLocaleCurrency();
  const { favorited, toggle } = useFavoriteTour({
    kind: "excursion",
    tourId: String(excursion.id),
    tourSlug: excursion.slug,
    tourTitle: excursion.title,
    tourImage: excursion.coverImage ?? "",
    cityName: excursion.cityName,
    country: "Аргентина",
  });

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle();
      }}
      aria-label={favorited ? t("excursions.favoriteRemove") : t("excursions.favoriteAdd")}
      aria-pressed={favorited}
      className={className}
    >
      <Heart
        className={cn(
          iconClassName ?? "h-4 w-4",
          favorited ? "fill-red-500 text-red-500" : "text-charcoal"
        )}
      />
    </button>
  );
}
