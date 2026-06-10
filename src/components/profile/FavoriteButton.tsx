"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";
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
      className={className}
    >
      <Heart
        className={cn(
          iconClassName ?? "h-4 w-4",
          favorited ? "fill-wine text-wine" : "text-charcoal"
        )}
      />
      {label ? <span>{label}</span> : null}
    </button>
  );
}
