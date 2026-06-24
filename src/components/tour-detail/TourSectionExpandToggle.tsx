"use client";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";

type TourSectionExpandToggleProps = {
  allExpanded: boolean;
  openCount: number;
  totalCount: number;
  openSegments: boolean[];
  onToggle: () => void;
  groupAriaLabel: string;
  segmentsTitle: string;
  statusLabel: string;
};

export default function TourSectionExpandToggle({
  allExpanded,
  openCount,
  totalCount,
  openSegments,
  onToggle,
  groupAriaLabel,
  segmentsTitle,
  statusLabel,
}: TourSectionExpandToggleProps) {
  return (
    <div
      role="group"
      aria-label={groupAriaLabel}
      className="flex max-w-full min-h-[44px] items-center gap-3 rounded-xl border border-sky/15 bg-gradient-to-br from-sky/[0.04] to-white px-3 py-2.5 shadow-sm transition-colors hover:border-sky/30 sm:min-h-0"
    >
      <button
        type="button"
        onClick={onToggle}
        className="min-w-0 flex-1 text-left"
        aria-label={groupAriaLabel}
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-charcoal">
            {allExpanded ? "Свернуть все" : "Раскрыть все"}
          </span>
          <span className="shrink-0 text-xs tabular-nums text-slate">
            {openCount}/{totalCount}
          </span>
        </div>

        <div className="mt-2 flex gap-0.5" aria-hidden title={segmentsTitle}>
          {openSegments.map((isOpen, index) => (
            <span
              key={index}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                isOpen ? "bg-sky" : "bg-gray-200",
              )}
            />
          ))}
        </div>

        <p className="mt-1.5 text-xs text-slate">{statusLabel}</p>
      </button>

      <Switch checked={allExpanded} onCheckedChange={() => onToggle()} aria-hidden />
    </div>
  );
}
