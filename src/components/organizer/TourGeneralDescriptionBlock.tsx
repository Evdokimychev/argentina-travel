"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import {
  ORGANIZER_TOUR_GENERAL_DESCRIPTION_MAX,
  countDescriptionWords,
} from "@/data/tour-description-defaults";
import { getPlainTextLength } from "@/lib/rich-text";
import RichTextEditor from "@/components/editor/RichTextEditor";
import { cn } from "@/lib/cn";

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
  const [expandedDiff, setExpandedDiff] = useState(false);

  const wordCount = countDescriptionWords(value);
  const charCount = getPlainTextLength(value);
  const diffPreviewLength = 140;
  const showDiffExpand = (variantDiff?.length ?? 0) > diffPreviewLength;

  return (
    <section className="space-y-5 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">Общее описание</h2>

      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-charcoal">
        Опишите, в чём уникальность и польза вашего тура по сравнению с другими. Рекомендуемый
        объём: не больше 2–3 абзацев по 2–3 предложения ({ORGANIZER_TOUR_GENERAL_DESCRIPTION_MAX}{" "}
        символов).
      </div>

      <RichTextEditor
        value={value}
        onChange={onChange}
        maxLength={ORGANIZER_TOUR_GENERAL_DESCRIPTION_MAX}
        placeholder="Расскажите, почему туристу стоит выбрать именно ваш тур…"
        minHeight={336}
        footer={
          <p className="text-right text-xs text-slate">
            Слов: {wordCount} · Символов: {charCount} / {ORGANIZER_TOUR_GENERAL_DESCRIPTION_MAX}
          </p>
        }
      />

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
