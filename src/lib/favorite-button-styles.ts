import { cn } from "@/lib/cn";

/** Круглая кнопка «избранное» на карточках (оверлей на фото). */
export const favoriteOverlayButtonClass = cn(
  "pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full",
  "border-0 bg-white/95 text-charcoal/75 shadow-sm backdrop-blur-sm",
  "transition-colors duration-200",
  "hover:bg-white hover:text-red-500",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/50 focus-visible:ring-offset-2"
);

/** Круглая кнопка рядом с заголовком на детальной странице. */
export const favoriteHeaderButtonClass = cn(
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
  "border border-gray-200/80 bg-white/90 text-charcoal/75 shadow-sm",
  "transition-colors duration-200",
  "hover:border-red-200/80 hover:bg-white hover:text-red-500",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/50 focus-visible:ring-offset-2"
);

/** Квадратная кнопка в строке действий (список туров). */
export const favoriteActionButtonClass = cn(
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
  "border border-gray-200 bg-white text-charcoal/75",
  "transition-colors duration-200",
  "hover:border-red-200/80 hover:bg-red-50/40 hover:text-red-500",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/50 focus-visible:ring-offset-2"
);

export function favoriteIconClass(favorited: boolean, sizeClass = "h-[18px] w-[18px]") {
  return cn(
    sizeClass,
    "transition-[color,transform] duration-200",
    favorited ? "scale-105 text-red-500" : "text-current group-hover:text-red-500"
  );
}
