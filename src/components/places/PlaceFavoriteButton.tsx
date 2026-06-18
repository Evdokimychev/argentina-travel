"use client";

import FavoriteHeartIcon from "@/components/ui/FavoriteHeartIcon";
import { cn } from "@/lib/cn";
import { favoriteIconClass } from "@/lib/favorite-button-styles";
import { useFavoriteTour } from "@/hooks/useFavoriteTour";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import type { PlaceListing } from "@/types/place";

export default function PlaceFavoriteButton({
  place,
  className,
  iconClassName,
}: {
  place: Pick<PlaceListing, "id" | "slug" | "name" | "coverImage" | "region">;
  className?: string;
  iconClassName?: string;
}) {
  const { t } = useLocaleCurrency();
  const { favorited, toggle } = useFavoriteTour({
    kind: "place",
    tourId: place.id,
    tourSlug: place.slug,
    tourTitle: place.name,
    tourImage: place.coverImage ?? "",
    region: place.region,
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
      aria-label={favorited ? t("places.favoriteRemove") : t("places.favoriteAdd")}
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
