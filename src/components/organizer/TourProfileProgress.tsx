"use client";

import { evaluateTourProfileCompletion, tourProfileCompletionPercent } from "@/lib/tour-profile-completion";
import type { OrganizerTourDraft } from "@/types/organizer-tour";
import { cn } from "@/lib/cn";

interface TourProfileProgressProps {
  draft: OrganizerTourDraft;
  compact?: boolean;
  className?: string;
}

export default function TourProfileProgress({
  draft,
  compact = false,
  className,
}: TourProfileProgressProps) {
  const percent = tourProfileCompletionPercent(draft);
  const { completedCount, totalCount } = evaluateTourProfileCompletion(draft);

  const tone =
    percent >= 85 ? "emerald" : percent >= 55 ? "sky" : percent >= 30 ? "amber" : "rose";

  const ringColor =
    tone === "emerald"
      ? "text-emerald-500"
      : tone === "sky"
        ? "text-sky"
        : tone === "amber"
          ? "text-amber-500"
          : "text-rose-500";

  const trackColor =
    tone === "emerald"
      ? "stroke-emerald-100"
      : tone === "sky"
        ? "stroke-sky/15"
        : tone === "amber"
          ? "stroke-amber-100"
          : "stroke-rose-100";

  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (percent / 100) * circumference;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="relative h-10 w-10 shrink-0">
          <svg className="h-10 w-10 -rotate-90" viewBox="0 0 40 40" aria-hidden>
            <circle cx="20" cy="20" r="18" fill="none" className={trackColor} strokeWidth="3" />
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              className={ringColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold tabular-nums text-charcoal">
            {percent}%
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-charcoal">Заполнение профиля</p>
          <p className="text-xs text-slate">
            {completedCount} из {totalCount} блоков
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border border-gray-200 bg-white p-4 shadow-sm", className)}>
      <div className="flex items-start gap-4">
        <div className="relative h-16 w-16 shrink-0">
          <svg className="h-16 w-16 -rotate-90" viewBox="0 0 40 40" aria-hidden>
            <circle cx="20" cy="20" r="18" fill="none" className={trackColor} strokeWidth="3" />
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              className={ringColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums text-charcoal">
            {percent}%
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-base font-bold text-charcoal">Заполнение профиля тура</p>
          <p className="mt-1 text-xs leading-relaxed text-slate">
            Заполнено {completedCount} из {totalCount} ключевых блоков. Чем полнее карточка — тем
            выше доверие туристов и конверсия в бронирование.
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                tone === "emerald" && "bg-emerald-500",
                tone === "sky" && "bg-sky",
                tone === "amber" && "bg-amber-500",
                tone === "rose" && "bg-rose-500"
              )}
              style={{ width: `${percent}%` }}
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Заполнение профиля тура: ${percent}%`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
