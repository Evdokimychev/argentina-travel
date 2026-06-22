"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

type BlogExpandableSectionProps = {
  title: string;
  headingId: string;
  summaryHint?: string;
  children: React.ReactNode;
  className?: string;
  accentClass?: string;
};

/** Сворачиваемая секция в стиле BlogFaqSection для чек-листов и советов. */
export default function BlogExpandableSection({
  title,
  headingId,
  summaryHint = "Развернуть",
  children,
  className,
  accentClass,
}: BlogExpandableSectionProps) {
  return (
    <details
      className={cn(
        "group rounded-2xl border border-gray-100 bg-white shadow-sm",
        accentClass,
        className,
      )}
    >
      <summary
        className="blog-touch-target cursor-pointer list-none px-4 py-4 marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 focus-visible:ring-offset-2 sm:px-5 [&::-webkit-details-marker]:hidden"
      >
        <span className="flex items-start justify-between gap-3">
          <span className="min-w-0">
            <h2
              id={headingId}
              className="font-heading text-xl font-bold text-charcoal sm:text-[1.375rem]"
            >
              {title}
            </h2>
            <span className="mt-1 block text-xs text-slate">{summaryHint}</span>
          </span>
          <ChevronDown
            className="mt-1 h-5 w-5 shrink-0 text-sky transition group-open:rotate-180 motion-reduce:transition-none motion-reduce:group-open:rotate-0"
            aria-hidden
          />
        </span>
      </summary>
      <div className="space-y-5 border-t border-gray-100 px-4 pb-5 pt-4 sm:px-5">{children}</div>
    </details>
  );
}
