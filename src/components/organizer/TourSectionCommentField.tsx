"use client";

import { TOUR_SECTION_ORGANIZER_COMMENT_MAX } from "@/lib/tour-section-comments";
import type { TourSectionCommentId } from "@/types/tour-section-comments";
import { TOUR_SECTION_COMMENT_LABELS } from "@/types/tour-section-comments";

interface TourSectionCommentFieldProps {
  sectionId: TourSectionCommentId;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}

export default function TourSectionCommentField({
  sectionId,
  value,
  onChange,
  hint,
}: TourSectionCommentFieldProps) {
  const label = TOUR_SECTION_COMMENT_LABELS[sectionId];
  const fieldId = `tour-section-comment-${sectionId}`;

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4 sm:p-5">
      <label htmlFor={fieldId} className="block text-sm font-semibold text-charcoal">
        Комментарий к блоку «{label}»
      </label>
      <p className="mt-1 text-sm text-slate">
        {hint ??
          "Короткая заметка для туристов в конце блока. На странице показывается сокращённо, полный текст — по раскрытию."}
      </p>
      <textarea
        id={fieldId}
        value={value}
        maxLength={TOUR_SECTION_ORGANIZER_COMMENT_MAX}
        rows={4}
        onChange={(event) =>
          onChange(event.target.value.slice(0, TOUR_SECTION_ORGANIZER_COMMENT_MAX))
        }
        placeholder="Например: что важно знать именно про этот раздел тура…"
        className="mt-3 w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-charcoal placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
      <p className="mt-1 text-right text-xs text-slate">
        {value.length} / {TOUR_SECTION_ORGANIZER_COMMENT_MAX}
      </p>
    </div>
  );
}
