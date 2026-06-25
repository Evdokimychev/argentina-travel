"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ComfortDotRating } from "@/components/marketplace/sidebar-filter-ui";
import { COMFORT_DOT_COUNT, COMFORT_LEVELS } from "@/data/tour-levels";
import { normalizeEditorValue } from "@/lib/rich-text";
import { cn } from "@/lib/cn";
import type { ComfortLevel } from "@/types";

interface AccommodationsComfortFooterProps {
  comfortLevel: ComfortLevel;
  comfortLevels?: ComfortLevel[];
  comfortDescriptionHtml?: string;
  className?: string;
  levelLabel?: string;
  dotCount?: number;
  hideHelpPopover?: boolean;
}

function ComfortHelpButton() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-slate/60 transition-colors hover:bg-gray-100 hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
          aria-label="Что означает уровень комфорта"
        >
          <HelpCircle className="h-3.5 w-3.5" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-3 text-sm leading-relaxed text-charcoal sm:max-w-[320px]"
        side="top"
        align="start"
      >
        <p className="text-xs font-semibold text-charcoal">Уровни комфорта</p>
        <ul className="mt-2 space-y-2">
          {COMFORT_LEVELS.map(({ level, description }) => (
            <li key={level}>
              <span className="font-medium text-charcoal">{level}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-slate">{description}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export default function AccommodationsComfortFooter({
  comfortLevel,
  comfortLevels = [],
  comfortDescriptionHtml = "",
  className,
  levelLabel,
  dotCount,
  hideHelpPopover = false,
}: AccommodationsComfortFooterProps) {
  const levelMeta = COMFORT_LEVELS.find((item) => item.level === comfortLevel);
  const extendedDescription = comfortDescriptionHtml.trim();
  const uniqueLevels = comfortLevels.length ? [...new Set(comfortLevels)] : [comfortLevel];
  const hasMultipleLevels = uniqueLevels.length > 1;
  const hasExpandableContent = Boolean(extendedDescription);
  const [expanded, setExpanded] = useState(false);
  const displayLabel = levelLabel?.trim() || comfortLevel;
  const filledDots = dotCount ?? COMFORT_DOT_COUNT[comfortLevel];

  const previewText = extendedDescription
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);

  return (
    <div
      className={cn(
        "mt-6 rounded-2xl border border-gray-100 bg-gradient-to-br from-sky/[0.04] to-white p-5 sm:p-6",
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-semibold text-charcoal">Уровень комфорта</p>
        {!hideHelpPopover ? <ComfortHelpButton /> : null}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span className="text-sm font-medium text-slate">{displayLabel}</span>
        <ComfortDotRating filled={filledDots} />
      </div>

      {hasMultipleLevels ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {uniqueLevels.map((level) => (
            <span
              key={level}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                level === comfortLevel ? "bg-brand/10 text-brand" : "bg-gray-100 text-slate"
              )}
            >
              {level}
            </span>
          ))}
        </div>
      ) : null}

      {levelMeta && !levelLabel ? (
        <p className="mt-2 text-sm leading-relaxed text-slate">{levelMeta.description}</p>
      ) : null}

      {hasExpandableContent ? (
        <div className={cn(levelMeta && "mt-4 border-t border-gray-100 pt-4")}>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="flex w-full items-start gap-3 text-left"
          >
            <span className="min-w-0 flex-1">
              <span className="text-sm font-semibold text-charcoal">
                {expanded ? "Свернуть подробности" : "Подробнее о комфорте"}
              </span>
              {!expanded && previewText ? (
                <span className="mt-1 block text-sm leading-snug text-slate line-clamp-2">
                  {previewText}
                  {extendedDescription.length > 120 && "…"}
                </span>
              ) : null}
            </span>
            <ChevronDown
              className={cn(
                "mt-0.5 h-5 w-5 shrink-0 text-slate transition-transform",
                expanded && "rotate-180"
              )}
              aria-hidden
            />
          </button>

          {expanded ? (
            <div
              className="rich-text-editor-content mt-4 animate-fade-in-up text-sm leading-relaxed text-slate"
              dangerouslySetInnerHTML={{
                __html: normalizeEditorValue(extendedDescription),
              }}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
