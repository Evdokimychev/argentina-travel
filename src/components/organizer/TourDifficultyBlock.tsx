"use client";

import { useRef } from "react";
import {
  Bold,
  Italic,
  Redo2,
  RemoveFormatting,
  Underline,
  Undo2,
} from "lucide-react";
import {
  DIFFICULTY_DOT_COUNT,
  DIFFICULTY_ICONS,
  DIFFICULTY_LEVELS,
} from "@/data/tour-levels";
import { DifficultyDotRating } from "@/components/marketplace/sidebar-filter-ui";
import { cn } from "@/lib/cn";
import type { DifficultyLevel } from "@/types";

function FormatToolbar({
  onBold,
  onItalic,
  onUnderline,
  onClear,
  onUndo,
  onRedo,
}: {
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
}) {
  const buttonClass =
    "flex h-8 w-8 items-center justify-center rounded-lg text-charcoal transition-colors hover:bg-gray-100";

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 px-2 py-1.5">
      <button type="button" className={buttonClass} onClick={onBold} aria-label="Жирный">
        <Bold className="h-4 w-4" />
      </button>
      <button type="button" className={buttonClass} onClick={onItalic} aria-label="Курсив">
        <Italic className="h-4 w-4" />
      </button>
      <button type="button" className={buttonClass} onClick={onUnderline} aria-label="Подчёркнутый">
        <Underline className="h-4 w-4" />
      </button>
      <button type="button" className={buttonClass} onClick={onClear} aria-label="Очистить формат">
        <RemoveFormatting className="h-4 w-4" />
      </button>
      <span className="mx-1 h-5 w-px bg-gray-200" />
      <button type="button" className={buttonClass} onClick={onUndo} aria-label="Отменить">
        <Undo2 className="h-4 w-4" />
      </button>
      <button type="button" className={buttonClass} onClick={onRedo} aria-label="Повторить">
        <Redo2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function wrapTextareaSelection(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string,
  value: string,
  onChange: (next: string) => void
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end);
  const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
  onChange(next);

  requestAnimationFrame(() => {
    textarea.focus();
    const cursor = start + before.length + selected.length + after.length;
    textarea.setSelectionRange(
      selected ? start + before.length : cursor,
      selected ? start + before.length + selected.length : cursor
    );
  });
}

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef<string[]>([difficultyDescriptionText]);
  const historyIndexRef = useRef(0);

  function pushHistory(next: string) {
    const history = historyRef.current.slice(0, historyIndexRef.current + 1);
    history.push(next);
    historyRef.current = history.slice(-30);
    historyIndexRef.current = historyRef.current.length - 1;
    onDifficultyDescriptionChange(next);
  }

  function applyFormat(before: string, after: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    wrapTextareaSelection(
      textarea,
      before,
      after,
      difficultyDescriptionText,
      pushHistory
    );
  }

  function undo() {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    onDifficultyDescriptionChange(historyRef.current[historyIndexRef.current]);
  }

  function redo() {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    onDifficultyDescriptionChange(historyRef.current[historyIndexRef.current]);
  }

  return (
    <section className="space-y-5 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="font-display text-xl font-bold text-charcoal sm:text-2xl">
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
        <h3 className="font-display text-base font-bold text-charcoal">
          Опишите, насколько сложная программа ждёт туристов
        </h3>

        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-charcoal">
          Вы несёте ответственность за безопасность туристов. Опишите меры предосторожности,
          необходимые навыки и возможные риски маршрута — эта информация поможет туристам принять
          решение о бронировании.
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <FormatToolbar
            onBold={() => applyFormat("**", "**")}
            onItalic={() => applyFormat("*", "*")}
            onUnderline={() => applyFormat("__", "__")}
            onClear={() => pushHistory(difficultyDescriptionText.replace(/[*_]{1,2}/g, ""))}
            onUndo={undo}
            onRedo={redo}
          />
          <textarea
            ref={textareaRef}
            value={difficultyDescriptionText}
            onChange={(event) => pushHistory(event.target.value)}
            rows={14}
            placeholder="Сложность программы, меры предосторожности, особенности маршрута…"
            className="w-full resize-y border-0 px-4 py-3 text-sm leading-relaxed text-charcoal outline-none focus:ring-0"
          />
        </div>
      </div>
    </section>
  );
}
