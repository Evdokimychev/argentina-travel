"use client";

import { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { LinkifiedText } from "@/components/blog/BlogLinkifiedText";
import { headingToAnchorId } from "@/lib/content-heading-id";
import { cn } from "@/lib/cn";

type Props = {
  items: Array<{ title: string; body: string; id?: string }>;
  /** When true, none start open (months calendar). Default opens none for SEO-first UX. */
  defaultOpenFirst?: boolean;
};

/** A paragraph chunk is a bullet list when every non-empty line starts with "* ". */
function isBulletList(lines: string[]): boolean {
  return lines.length > 0 && lines.every((line) => line.startsWith("* "));
}

function AccordionBody({ text }: { text: string }) {
  const chunks = text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (chunks.length === 0) return null;

  return (
    <div className="space-y-3 border-t border-gray-100 px-4 py-3 text-sm leading-relaxed text-slate">
      {chunks.map((chunk, chunkIndex) => {
        const lines = chunk.split("\n").map((line) => line.trim()).filter(Boolean);
        if (isBulletList(lines)) {
          return (
            <ul key={`${chunkIndex}-${chunk}`} className="m-0 list-none space-y-1.5">
              {lines.map((line, lineIndex) => (
                <li key={`${lineIndex}-${line}`} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky" aria-hidden />
                  <span>
                    <LinkifiedText text={line.replace(/^\*\s+/, "")} as="span" />
                  </span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={`${chunkIndex}-${chunk}`} className="m-0">
            <LinkifiedText text={chunk} as="span" />
          </p>
        );
      })}
    </div>
  );
}

/**
 * Accordion with all panels always in the DOM (details/summary).
 * Closed state is visual only — texts remain in initial HTML for SEO/a11y.
 */
export default function BlogAccordionBlock({
  items,
  defaultOpenFirst = false,
}: Props) {
  const filtered = items.filter((item) => item.title.trim() || item.body.trim());
  const usedIds = useRef(new Set<string>());

  const itemIds = filtered.map((item, index) => {
    if (item.id?.trim()) return item.id.trim();
    return headingToAnchorId(item.title || `item-${index + 1}`, usedIds.current);
  });

  useEffect(() => {
    const openFromHash = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash) return;
      const el = document.getElementById(hash);
      if (!(el instanceof HTMLDetailsElement)) return;
      el.open = true;
      el.scrollIntoView({ block: "nearest" });
    };

    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  if (filtered.length === 0) return null;

  return (
    <div className="space-y-2" role="group" aria-label="Раскрывающиеся разделы">
      {filtered.map((item, index) => {
        const id = itemIds[index];
        return (
          <details
            key={id}
            id={id}
            // Border only, no shadow (including on the open state) — the
            // sources accordion already sits inside a flattened section, and
            // a shadow here would stack another floating card layer inside
            // the article.
            className="group overflow-hidden rounded-2xl border border-gray-100 bg-white"
            open={defaultOpenFirst && index === 0 ? true : undefined}
          >
            <summary
              className={cn(
                "blog-touch-target flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-charcoal",
                "marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 focus-visible:ring-offset-2",
                "[&::-webkit-details-marker]:hidden",
              )}
            >
              <span className="min-w-0 flex-1">{item.title || `Пункт ${index + 1}`}</span>
              <ChevronDown
                className="h-4 w-4 shrink-0 text-slate transition group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <AccordionBody text={item.body} />
          </details>
        );
      })}
    </div>
  );
}
