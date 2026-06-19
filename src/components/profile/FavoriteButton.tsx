"use client";

import { cn } from "@/lib/cn";
import FavoriteHeartIcon from "@/components/ui/FavoriteHeartIcon";
import { favoriteIconClass } from "@/lib/favorite-button-styles";
import { useFavoriteTour, type FavoriteTourInput } from "@/hooks/useFavoriteTour";

interface FavoriteButtonProps extends FavoriteTourInput {
  className?: string;
  iconClassName?: string;
  label?: string;
  onClick?: (event: React.MouseEvent) => void;
}

export default function FavoriteButton({
  className,
  iconClassName,
  label,
  onClick,
  ...tour
}: FavoriteButtonProps) {
  const { favorited, toggle } = useFavoriteTour(tour);

  return (
    <button
      type="button"
      onClick={(event) => {
        onClick?.(event);
        toggle();
      }}
      aria-label={favorited ? "Убрать из избранного" : "Добавить в избранное"}
      aria-pressed={favorited}
      className={cn("group", className, favorited && "text-red-500")}
    >
      <FavoriteHeartIcon
        filled={favorited}
        className={favoriteIconClass(favorited, iconClassName ?? "h-[18px] w-[18px]")}
      />
      {label ? <span>{label}</span> : null}
    </button>
  );
}
