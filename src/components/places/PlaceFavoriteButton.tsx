"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";
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
      className={className}
    >
      <Heart
        className={cn(
          iconClassName ?? "h-4 w-4",
          favorited ? "fill-wine text-wine" : "text-charcoal",
        )}
      />
    </button>
  );
}
