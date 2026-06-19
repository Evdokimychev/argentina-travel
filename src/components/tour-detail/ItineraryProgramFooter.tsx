"use client";

import { HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DifficultyDotRating } from "@/components/marketplace/sidebar-filter-ui";
import { DIFFICULTY_DOT_COUNT, DIFFICULTY_LEVELS } from "@/data/tour-levels";
import { normalizeEditorValue } from "@/lib/rich-text";
import { cn } from "@/lib/cn";
import type { DifficultyLevel } from "@/types";
import type { TourTravelRisk } from "@/types/tour-travel-risk";
import TourTravelRisksPanel from "./TourTravelRisksPanel";
import TourSectionOrganizerNote from "./TourSectionOrganizerNote";

interface ItineraryProgramFooterProps {
  difficulty: DifficultyLevel;
  difficultyDescriptionHtml?: string;
  organizerComment?: string;
  travelRisks?: TourTravelRisk[];
  className?: string;
}

function DifficultyHelpButton() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-slate/60 transition-colors hover:bg-gray-100 hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
          aria-label="Что означает уровень сложности"
        >
          <HelpCircle className="h-3.5 w-3.5" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="max-w-[min(320px,calc(100vw-2rem))] p-3 text-sm leading-relaxed text-charcoal"
        side="top"
        align="start"
      >
        <p className="text-xs font-semibold text-charcoal">Уровни сложности</p>
        <ul className="mt-2 space-y-2">
          {DIFFICULTY_LEVELS.map(({ level, description }) => (
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

export default function ItineraryProgramFooter({
  difficulty,
  difficultyDescriptionHtml = "",
  organizerComment = "",
  travelRisks = [],
  className,
}: ItineraryProgramFooterProps) {
  const levelMeta = DIFFICULTY_LEVELS.find((item) => item.level === difficulty);
  const extendedDescription = difficultyDescriptionHtml.trim();
  const comment = organizerComment.trim();
  const showComment = comment.length > 0;
  const showRisks = travelRisks.length > 0;

  return (
    <div
      className={cn(
        "mt-6 rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50/80 to-white p-5 sm:p-6",
        className
      )}
    >
      <div>
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-charcoal">Сложность</p>
          <DifficultyHelpButton />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="text-sm font-medium text-slate">{difficulty}</span>
          <DifficultyDotRating filled={DIFFICULTY_DOT_COUNT[difficulty]} />
        </div>

        {levelMeta ? (
          <p className="mt-2 text-sm leading-relaxed text-slate">{levelMeta.description}</p>
        ) : null}

        {extendedDescription ? (
          <div
            className="rich-text-editor-content mt-3 text-sm leading-relaxed text-slate"
            dangerouslySetInnerHTML={{ __html: normalizeEditorValue(extendedDescription) }}
          />
        ) : null}
      </div>

      {showRisks ? (
        <TourTravelRisksPanel risks={travelRisks} variant="embedded" />
      ) : null}

      {showComment ? (
        <TourSectionOrganizerNote comment={comment} embedded />
      ) : null}
    </div>
  );
}
