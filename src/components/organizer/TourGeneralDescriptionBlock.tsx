"use client";

import { useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  Table2,
  Underline,
  Undo2,
} from "lucide-react";
import {
  ORGANIZER_TOUR_GENERAL_DESCRIPTION_MAX,
  countDescriptionWords,
} from "@/data/tour-description-defaults";
import { cn } from "@/lib/cn";

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
  onChange(next.slice(0, ORGANIZER_TOUR_GENERAL_DESCRIPTION_MAX));

  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(
      start + before.length,
      start + before.length + selected.length
    );
  });
}

function prefixLines(value: string, prefix: string) {
  const lines = value.split("\n");
  return lines.map((line) => (line.trim() ? `${prefix}${line}` : line)).join("\n");
}

interface TourGeneralDescriptionBlockProps {
  value: string;
  onChange: (next: string) => void;
  variantLabel?: string;
  variantDiff?: string;
  onApplySync?: () => void;
}

export default function TourGeneralDescriptionBlock({
  value,
  onChange,
  variantLabel,
  variantDiff,
  onApplySync,
}: TourGeneralDescriptionBlockProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef<string[]>([value]);
  const historyIndexRef = useRef(0);
  const [expandedDiff, setExpandedDiff] = useState(false);

  const buttonClass =
    "flex h-8 w-8 items-center justify-center rounded-lg text-charcoal transition-colors hover:bg-gray-100";

  function pushHistory(next: string) {
    const limited = next.slice(0, ORGANIZER_TOUR_GENERAL_DESCRIPTION_MAX);
    const history = historyRef.current.slice(0, historyIndexRef.current + 1);
    history.push(limited);
    historyRef.current = history.slice(-30);
    historyIndexRef.current = historyRef.current.length - 1;
    onChange(limited);
  }

  function applyFormat(before: string, after: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    wrapTextareaSelection(textarea, before, after, value, pushHistory);
  }

  function undo() {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    onChange(historyRef.current[historyIndexRef.current]);
  }

  function redo() {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    onChange(historyRef.current[historyIndexRef.current]);
  }

  const wordCount = countDescriptionWords(value);
  const charCount = value.length;
  const diffPreviewLength = 140;
  const showDiffExpand = (variantDiff?.length ?? 0) > diffPreviewLength;

  return (
    <section className="space-y-5 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="font-display text-xl font-bold text-charcoal sm:text-2xl">Общее описание</h2>

      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-charcoal">
        Опишите, в чём уникальность и польза вашего тура по сравнению с другими. Рекомендуемый
        объём: не больше 2–3 абзацев по 2–3 предложения ({ORGANIZER_TOUR_GENERAL_DESCRIPTION_MAX}{" "}
        символов).
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 px-2 py-1.5">
          <button type="button" className={buttonClass} onClick={() => applyFormat("**", "**")} aria-label="Жирный">
            <Bold className="h-4 w-4" />
          </button>
          <button type="button" className={buttonClass} onClick={() => applyFormat("*", "*")} aria-label="Курсив">
            <Italic className="h-4 w-4" />
          </button>
          <button type="button" className={buttonClass} onClick={() => applyFormat("__", "__")} aria-label="Подчёркнутый">
            <Underline className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={buttonClass}
            onClick={() => applyFormat("[", "](https://)")}
            aria-label="Ссылка"
          >
            <Link2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={buttonClass}
            onClick={() => {
              const textarea = textareaRef.current;
              if (!textarea) return;
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const selected = value.slice(start, end);
              const block = selected ? prefixLines(selected, "• ") : "• ";
              wrapTextareaSelection(textarea, block, "", value, pushHistory);
            }}
            aria-label="Маркированный список"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={buttonClass}
            onClick={() => {
              const textarea = textareaRef.current;
              if (!textarea) return;
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const selected = value.slice(start, end);
              const lines = (selected || "Пункт").split("\n");
              const block = lines.map((line, index) => `${index + 1}. ${line.replace(/^\d+\.\s*/, "")}`).join("\n");
              wrapTextareaSelection(textarea, block, "", value, pushHistory);
            }}
            aria-label="Нумерованный список"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={buttonClass}
            onClick={() => pushHistory(value.replace(/[*_~[\]()#>`|]/g, ""))}
            aria-label="Очистить формат"
          >
            <RemoveFormatting className="h-4 w-4" />
          </button>
          <span className="mx-1 h-5 w-px bg-gray-200" />
          <button type="button" className={buttonClass} aria-label="Выравнивание слева">
            <AlignLeft className="h-4 w-4" />
          </button>
          <button type="button" className={buttonClass} aria-label="Выравнивание по центру">
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={buttonClass}
            onClick={() => applyFormat("> ", "")}
            aria-label="Цитата"
          >
            <Quote className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={buttonClass}
            onClick={() =>
              applyFormat(
                "\n| Колонка 1 | Колонка 2 |\n| --- | --- |\n| ",
                " | значение |"
              )
            }
            aria-label="Таблица"
          >
            <Table2 className="h-4 w-4" />
          </button>
          <span className="mx-1 h-5 w-px bg-gray-200" />
          <button type="button" className={buttonClass} onClick={undo} aria-label="Отменить">
            <Undo2 className="h-4 w-4" />
          </button>
          <button type="button" className={buttonClass} onClick={redo} aria-label="Повторить">
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => pushHistory(event.target.value)}
          rows={14}
          placeholder="Расскажите, почему туристу стоит выбрать именно ваш тур…"
          className="w-full resize-y border-0 px-4 py-3 text-sm leading-relaxed text-charcoal outline-none focus:ring-0"
        />

        <div className="border-t border-gray-200 px-4 py-2 text-right text-xs text-slate">
          Слов: {wordCount} · Символов: {charCount} / {ORGANIZER_TOUR_GENERAL_DESCRIPTION_MAX}
        </div>
      </div>

      {variantDiff && variantLabel ? (
        <div className="space-y-3">
          {onApplySync ? (
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-charcoal">
              <button type="button" onClick={onApplySync} className="text-left">
                <Link2 className="mr-1.5 inline h-4 w-4 align-[-2px] text-brand" />
                Применить изменение во всех вариантах тура?{" "}
                <span className="font-semibold text-brand hover:underline">Применить</span>
              </button>
            </div>
          ) : null}
          <div className="rounded-xl bg-brand-light/80 px-4 py-3 text-sm leading-relaxed text-charcoal">
            <p>
              Отличия в варианте «{variantLabel}»:{" "}
              {expandedDiff || !showDiffExpand
                ? variantDiff
                : `${variantDiff.slice(0, diffPreviewLength)}…`}{" "}
              {showDiffExpand ? (
                <button
                  type="button"
                  onClick={() => setExpandedDiff((prev) => !prev)}
                  className={cn("font-semibold text-brand hover:underline")}
                >
                  {expandedDiff ? "Свернуть" : "Развернуть"}
                </button>
              ) : null}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
