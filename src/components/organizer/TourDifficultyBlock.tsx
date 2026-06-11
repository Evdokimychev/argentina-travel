"use client";

import {
  DIFFICULTY_DOT_COUNT,
  DIFFICULTY_ICONS,
  DIFFICULTY_LEVELS,
} from "@/data/tour-levels";
import { DifficultyDotRating } from "@/components/marketplace/sidebar-filter-ui";
import RichTextEditor from "@/components/editor/RichTextEditor";
import { cn } from "@/lib/cn";
import type { DifficultyLevel } from "@/types";

const DIFFICULTY_DESCRIPTION_MAX = 4000;

interface TourDifficultyBlockProps {
  difficultyLevel: DifficultyLevel;
  difficultyDescriptionText: string;
  onDifficultyLevelChange: (level: DifficultyLevel) => void;
  onDifficultyDescriptionChange: (text: string) => void;
}

export default function TourDifficultyBlock({
  difficultyLevel,
  difficultyDescriptionText,
  onDifficultyLevelChange,
  onDifficultyDescriptionChange,
}: TourDifficultyBlockProps) {
  return (
    <section className="space-y-5 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">
        Уровень сложности тура
      </h2>

      <div className="space-y-3">
        {DIFFICULTY_LEVELS.map(({ level, description, example }) => {
          const selected = difficultyLevel === level;
          const Icon = DIFFICULTY_ICONS[level];
          const dots = DIFFICULTY_DOT_COUNT[level];

          return (
            <label
              key={level}
              className={cn(
                "flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors",
                selected
                  ? "border-sky/40 bg-sky/[0.08] ring-1 ring-sky/20"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              <input
                type="radio"
                name="tour-difficulty-level"
                value={level}
                checked={selected}
                onChange={() => onDifficultyLevelChange(level)}
                className="mt-1 h-4 w-4 shrink-0 accent-brand"
              />
              <span className="flex min-w-0 flex-1 gap-3">
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    selected ? "bg-white text-brand shadow-sm" : "bg-gray-100 text-charcoal"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-charcoal">{level}</span>
                    <DifficultyDotRating filled={dots} />
                  </span>
                  <p className="mt-1 text-sm leading-relaxed text-charcoal">{description}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate">{example}</p>
                </span>
              </span>
            </label>
          );
        })}
      </div>

      <div className="space-y-3 border-t border-gray-200/80 pt-5">
        <h3 className="font-heading text-base font-bold text-charcoal">
          Опишите, насколько сложная программа ждёт туристов
        </h3>

        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-charcoal">
          Вы несёте ответственность за безопасность туристов. Опишите меры предосторожности,
          необходимые навыки и возможные риски маршрута — эта информация поможет туристам принять
          решение о бронировании.
        </div>

        <RichTextEditor
          value={difficultyDescriptionText}
          onChange={onDifficultyDescriptionChange}
          maxLength={DIFFICULTY_DESCRIPTION_MAX}
          placeholder="Сложность программы, меры предосторожности, особенности маршрута…"
          minHeight={336}
          toolbar="basic"
        />
      </div>
    </section>
  );
}
