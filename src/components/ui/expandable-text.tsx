"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { htmlToPlainText } from "@/lib/rich-text";

export const EXPANDABLE_TEXT_PREVIEW_LENGTH = 280;

function truncateParagraphs(paragraphs: string[], previewLength: number): string[] {
  let budget = previewLength;
  const visible: string[] = [];

  for (const paragraph of paragraphs) {
    if (budget <= 0) break;
    if (paragraph.length <= budget) {
      visible.push(paragraph);
      budget -= paragraph.length + 2;
      continue;
    }
    visible.push(`${paragraph.slice(0, budget).trim()}…`);
    break;
  }

  return visible.length ? visible : paragraphs.slice(0, 1);
}

type ExpandableTextProps = {
  text?: string;
  paragraphs?: string[];
  previewLength?: number;
  className?: string;
  paragraphClassName?: string;
  expandLabel?: string;
  collapseLabel?: string;
};

export default function ExpandableText({
  text,
  paragraphs,
  previewLength = EXPANDABLE_TEXT_PREVIEW_LENGTH,
  className,
  paragraphClassName,
  expandLabel = "Ещё",
  collapseLabel = "Свернуть",
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);

  const allParagraphs =
    paragraphs?.length
      ? paragraphs
      : text?.trim()
        ? [text.trim()]
        : [];

  if (!allParagraphs.length) return null;

  const fullPlain = allParagraphs.join("\n\n");
  const canExpand = fullPlain.length > previewLength;
  const visibleParagraphs =
    expanded || !canExpand ? allParagraphs : truncateParagraphs(allParagraphs, previewLength);

  return (
    <div className={className}>
      <div className="space-y-3">
        {visibleParagraphs.map((paragraph, index) => (
          <p
            key={`${index}-${paragraph.slice(0, 24)}`}
            className={cn(paragraphClassName)}
          >
            {paragraph}
          </p>
        ))}
      </div>
      {canExpand ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="mt-1 text-sm font-medium text-sky hover:text-sky-dark"
        >
          {expanded ? collapseLabel : expandLabel}
        </button>
      ) : null}
    </div>
  );
}

function splitRichIntroHtml(html: string): { bodyHtml: string; listHtml?: string } {
  const match = html.match(/^(.*?)(<ul[\s>][\s\S]*)$/i);
  if (!match) return { bodyHtml: html };
  return {
    bodyHtml: match[1].trim(),
    listHtml: match[2].trim(),
  };
}

type ExpandableRichHtmlProps = {
  html: string;
  previewLength?: number;
  className?: string;
  contentClassName?: string;
  expandLabel?: string;
  collapseLabel?: string;
};

export function ExpandableRichHtml({
  html,
  previewLength = EXPANDABLE_TEXT_PREVIEW_LENGTH,
  className,
  contentClassName,
  expandLabel = "Ещё",
  collapseLabel = "Свернуть",
}: ExpandableRichHtmlProps) {
  const [expanded, setExpanded] = useState(false);
  const { bodyHtml, listHtml } = splitRichIntroHtml(html);
  const canExpand = htmlToPlainText(bodyHtml).length > previewLength;

  return (
    <div className={className}>
      <div
        className={cn(
          "rich-text-editor-content leading-relaxed text-charcoal/90",
          contentClassName,
          canExpand && !expanded && "max-h-24 overflow-hidden",
        )}
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
      {canExpand ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="mt-1 text-sm font-medium text-sky hover:text-sky-dark"
        >
          {expanded ? collapseLabel : expandLabel}
        </button>
      ) : null}
      {listHtml ? (
        <div
          className={cn(
            "rich-text-editor-content leading-relaxed text-charcoal/90",
            contentClassName,
            canExpand ? "mt-4" : "mt-3",
          )}
          dangerouslySetInnerHTML={{ __html: listHtml }}
        />
      ) : null}
    </div>
  );
}
