import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

const SIZE_CLASS = {
  xs: "h-3 w-3",
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
} as const;

export type StarRatingSize = keyof typeof SIZE_CLASS;

interface StarRatingProps {
  /** Filled star count (1–5). Omit for badge/new states. */
  stars?: number;
  /** Catalog badge: numeric score text */
  score?: string;
  /** Review count shown in parentheses */
  count?: number;
  /** Single-star “new tour / new organizer” badge */
  isNew?: boolean;
  newLabel?: string;
  size?: StarRatingSize;
  className?: string;
  /** `inline` — row of filled stars; `badge` — catalog score or new label */
  layout?: "inline" | "badge";
  max?: number;
}

export function StarRating({
  stars = 0,
  score,
  count,
  isNew = false,
  newLabel = "Новый",
  size = "md",
  className,
  layout = "inline",
  max = 5,
}: StarRatingProps) {
  const iconClass = SIZE_CLASS[size];

  if (layout === "badge") {
    if (isNew || !score) {
      return (
        <span className={cn("inline-flex shrink-0 items-center gap-1 text-sky", className)}>
          <Star className={cn(iconClass, "fill-current")} aria-hidden />
          <span className="font-medium">{newLabel}</span>
        </span>
      );
    }

    return (
      <span className={cn("inline-flex shrink-0 items-center gap-1", className)}>
        <Star className={cn(iconClass, "fill-sun text-sun")} aria-hidden />
        <span className="font-semibold text-charcoal">{score}</span>
        {count != null ? <span className="text-slate">({count})</span> : null}
      </span>
    );
  }

  const filled = Math.min(max, Math.max(0, stars));

  return (
    <span
      className={cn("inline-flex items-center gap-0.5 text-sun", className)}
      aria-label={`Рейтинг ${filled} из ${max}`}
    >
      {Array.from({ length: filled }, (_, index) => (
        <Star key={index} className={cn(iconClass, "fill-current")} aria-hidden />
      ))}
    </span>
  );
}
