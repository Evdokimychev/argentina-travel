"use client";

import { useState } from "react";
import { ChevronDown, MessageSquareQuote } from "lucide-react";
import { getSectionOrganizerCommentPreview } from "@/lib/tour-section-comments";
import { cn } from "@/lib/cn";

function CommentParagraphs({ text, className }: { text: string; className?: string }) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return (
      <p className={cn("text-sm leading-relaxed text-slate whitespace-pre-line", className)}>
        {text.trim()}
      </p>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="text-sm leading-relaxed text-slate">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

interface TourSectionOrganizerNoteProps {
  comment?: string;
  className?: string;
  /** Заголовок блока (по умолчанию «Комментарий организатора»). */
  title?: string;
  /** Встроенный в другой footer — без верхней границы */
  embedded?: boolean;
}

export default function TourSectionOrganizerNote({
  comment = "",
  className,
  title = "Комментарий организатора",
  embedded = false,
}: TourSectionOrganizerNoteProps) {
  const trimmed = comment.trim();
  const [expanded, setExpanded] = useState(false);

  if (!trimmed) return null;

  const { preview, needsExpand } = getSectionOrganizerCommentPreview(trimmed);

  const shell = (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
        <MessageSquareQuote className="h-4 w-4 text-brand" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-sm font-semibold text-charcoal">{title}</span>
        {needsExpand ? (
          <>
            {!expanded ? (
              <span className="mt-1.5 block text-sm leading-relaxed text-slate">{preview}</span>
            ) : (
              <CommentParagraphs text={trimmed} className="mt-2" />
            )}
          </>
        ) : (
          <CommentParagraphs text={trimmed} className="mt-1.5" />
        )}
      </span>
      {needsExpand ? (
        <ChevronDown
          className={cn(
            "mt-1 h-5 w-5 shrink-0 text-slate transition-transform",
            expanded && "rotate-180"
          )}
          aria-hidden
        />
      ) : null}
    </div>
  );

  if (needsExpand) {
    return (
      <div
        className={cn(
          embedded ? "pt-5" : "mt-6 border-t border-gray-100 pt-5",
          className
        )}
      >
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="w-full rounded-2xl border border-gray-100 bg-gradient-to-br from-brand-light/25 to-white p-4 text-left transition-colors hover:border-brand/15 sm:p-5"
        >
          {shell}
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        embedded ? "pt-5" : "mt-6 border-t border-gray-100 pt-5",
        className
      )}
    >
      <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-brand-light/25 to-white p-4 sm:p-5">
        {shell}
      </div>
    </div>
  );
}
