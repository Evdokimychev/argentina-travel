"use client";

import FavoriteHeartIcon from "@/components/ui/FavoriteHeartIcon";
import { cn } from "@/lib/cn";
import { favoriteIconClass } from "@/lib/favorite-button-styles";
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
      className={cn("group", className, favorited && "text-red-500")}
    >
      <FavoriteHeartIcon
        filled={favorited}
        className={favoriteIconClass(favorited, iconClassName ?? "h-[18px] w-[18px]")}
      />
    </button>
  );
}
