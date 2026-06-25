"use client";

import { Activity, BedDouble, HelpCircle, type LucideIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ComfortBarRating,
  ComfortDotRating,
  DifficultyDotRating,
} from "@/components/marketplace/sidebar-filter-ui";
import { cn } from "@/lib/cn";
import {
  YOUTRAVEL_ACTIVITY_LEVELS,
  YOUTRAVEL_COMFORT_DETAIL_LABELS,
  YOUTRAVEL_COMFORT_LEVELS,
  type YouTravelActivityLevel,
  type YouTravelComfortLevel,
} from "@/lib/youtravel/partner-levels";

type GradationVariant = "activity" | "comfort";

function ActivityBarRating({ filled, total = 5 }: { filled: number; total?: number }) {
  return (
    <div className="flex w-full gap-1" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full",
            i < filled ? (i >= 4 ? "bg-red-500" : "bg-brand") : "bg-gray-200",
          )}
        />
      ))}
    </div>
  );
}

function GradationHelpPopover({
  variant,
  currentLevel,
}: {
  variant: GradationVariant;
  currentLevel: number;
}) {
  const title = variant === "activity" ? "Уровни активности" : "Уровни комфорта";
  const levels =
    variant === "activity"
      ? (Object.keys(YOUTRAVEL_ACTIVITY_LEVELS) as unknown as YouTravelActivityLevel[]).map(
          (level) => ({
            level,
            label: YOUTRAVEL_ACTIVITY_LEVELS[level].label,
            description: YOUTRAVEL_ACTIVITY_LEVELS[level].description,
          }),
        )
      : (Object.keys(YOUTRAVEL_COMFORT_LEVELS) as unknown as YouTravelComfortLevel[]).map(
          (level) => ({
            level,
            label: YOUTRAVEL_COMFORT_DETAIL_LABELS[level],
            description: YOUTRAVEL_COMFORT_LEVELS[level].description,
          }),
        );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-slate/60 transition-colors hover:bg-gray-100 hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
          aria-label={
            variant === "activity"
              ? "Что означает уровень активности"
              : "Что означает уровень комфорта"
          }
        >
          <HelpCircle className="h-3.5 w-3.5" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-3 text-sm leading-relaxed text-charcoal sm:max-w-[320px]"
        side="top"
        align="start"
      >
        <p className="text-xs font-semibold text-charcoal">{title}</p>
        <ul className="mt-2 space-y-2">
          {levels.map(({ level, label, description }) => (
            <li
              key={level}
              className={cn(
                "rounded-lg px-2 py-1.5",
                level === currentLevel && "bg-sky/[0.08] ring-1 ring-sky/15",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-charcoal">{label}</span>
                {variant === "activity" ? (
                  <DifficultyDotRating filled={level} />
                ) : (
                  <ComfortDotRating filled={level} />
                )}
              </div>
              <span className="mt-0.5 block text-xs leading-relaxed text-slate">{description}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export default function YouTravelGradationDetailCard({
  variant,
  title,
  displayLabel,
  level,
  icon,
}: {
  variant: GradationVariant;
  title: string;
  displayLabel: string;
  level: number;
  icon?: LucideIcon;
}) {
  const Icon = icon ?? (variant === "activity" ? Activity : BedDouble);

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky/10 text-sky">
        <Icon className="h-[18px] w-[18px] stroke-[1.75]" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="text-sm text-slate">{title}</p>
          <GradationHelpPopover variant={variant} currentLevel={level} />
        </div>

        <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <p className="text-sm font-semibold leading-snug text-charcoal">{displayLabel}</p>
          {variant === "activity" ? (
            <DifficultyDotRating filled={level} />
          ) : (
            <ComfortDotRating filled={level} />
          )}
        </div>

        <div className="mt-2">
          {variant === "activity" ? (
            <ActivityBarRating filled={level} />
          ) : (
            <ComfortBarRating filled={level} />
          )}
        </div>
      </div>
    </div>
  );
}
