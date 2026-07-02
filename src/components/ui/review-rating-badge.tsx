"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatReviews } from "@/lib/pluralize";

const SIZE_CLASS = {
  sm: {
    root: "gap-1 px-2 py-0.5 text-xs",
    icon: "h-3 w-3",
    dot: "text-[10px]",
  },
  md: {
    root: "gap-1.5 px-2.5 py-1 text-sm",
    icon: "h-3.5 w-3.5",
    dot: "text-xs",
  },
  lg: {
    root: "gap-2 px-3 py-1.5 text-base",
    icon: "h-4 w-4",
    dot: "text-sm",
  },
} as const;

export type ReviewRatingBadgeSize = keyof typeof SIZE_CLASS;

export type ReviewRatingBadgeProps = {
  score?: string;
  reviewCount?: number;
  isNew?: boolean;
  newLabel?: string;
  size?: ReviewRatingBadgeSize;
  className?: string;
  onClick?: () => void;
  /** When true, show review count even if zero (hidden by default). */
  showZeroReviews?: boolean;
};

function ReviewRatingBadgeContent({
  score,
  reviewCount,
  isNew,
  newLabel = "Новый",
  size = "md",
  showZeroReviews = false,
}: Pick<
  ReviewRatingBadgeProps,
  "score" | "reviewCount" | "isNew" | "newLabel" | "size" | "showZeroReviews"
>) {
  const sizeClass = SIZE_CLASS[size];

  if (isNew || !score) {
    return (
      <>
        <Star className={cn(sizeClass.icon, "fill-current")} aria-hidden />
        <span className="font-medium">{newLabel}</span>
      </>
    );
  }

  const showCount =
    reviewCount != null && (reviewCount > 0 || showZeroReviews);

  return (
    <>
      <Star className={cn(sizeClass.icon, "fill-sun text-sun")} aria-hidden />
      <span className="font-semibold text-charcoal">{score}</span>
      {showCount ? (
        <>
          <span className={cn("font-normal text-slate/70", sizeClass.dot)} aria-hidden>
            ·
          </span>
          <span className="font-medium text-slate">{formatReviews(reviewCount)}</span>
        </>
      ) : null}
    </>
  );
}

export function ReviewRatingBadge({
  score,
  reviewCount,
  isNew = false,
  newLabel = "Новый",
  size = "md",
  className,
  onClick,
  showZeroReviews = false,
}: ReviewRatingBadgeProps) {
  const sizeClass = SIZE_CLASS[size];
  const rated = !isNew && Boolean(score);
  const effectiveCount =
    reviewCount != null && (reviewCount > 0 || showZeroReviews) ? reviewCount : undefined;

  const rootClass = cn(
    "inline-flex shrink-0 items-center",
    sizeClass.root,
    rated
      ? "rounded-full border border-sun/20 bg-sun/10 text-charcoal transition-colors hover:bg-sun/15"
      : "rounded-full border border-sky/15 bg-sky/5 text-sky-ink",
    onClick && "cursor-pointer",
    className,
  );

  const content = (
    <ReviewRatingBadgeContent
      score={score}
      reviewCount={effectiveCount}
      isNew={isNew}
      newLabel={newLabel}
      size={size}
      showZeroReviews={showZeroReviews}
    />
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={rootClass}>
        {content}
      </button>
    );
  }

  return <span className={rootClass}>{content}</span>;
}
