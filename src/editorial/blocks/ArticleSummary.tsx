"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type {
  BlogArticleSummaryItem,
  BlogArticleSummaryVariant,
  BlogEditorialDensity,
} from "@/types/blog-content-blocks";

type Props = {
  title?: string;
  variant?: BlogArticleSummaryVariant;
  items: BlogArticleSummaryItem[];
  density?: BlogEditorialDensity;
};

export default function ArticleSummary({
  title = "Коротко о главном",
  variant = "cards",
  items,
  density = "comfortable",
}: Props) {
  const labelId = useId();
  const filtered = items.filter((item) => item.title.trim() && item.body.trim());
  const [active, setActive] = useState(0);

  if (filtered.length === 0) return null;

  const isDeck = variant === "horizontal-deck" || variant === "timeline-summary";

  return (
    <section
      className={cn(
        "not-prose rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/10 dark:bg-surface-elevated",
        density === "compact" ? "p-3" : "p-4 sm:p-5",
      )}
      aria-labelledby={labelId}
      data-editorial-block="article-summary"
      data-variant={variant}
    >
      <div className="mb-3 flex items-end justify-between gap-3">
        <h3 id={labelId} className="font-heading text-base font-semibold text-charcoal sm:text-lg">
          {title}
        </h3>
        {isDeck ? (
          <p className="text-xs text-slate dark:text-muted" aria-live="polite">
            {active + 1} / {filtered.length}
          </p>
        ) : null}
      </div>

      {isDeck ? (
        <div className="space-y-3">
          <div
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 motion-reduce:snap-none"
            role="list"
          >
            {filtered.map((item, index) => (
              <article
                key={`${item.title}-${index}`}
                role="listitem"
                className={cn(
                  "min-w-[85%] snap-start rounded-xl border border-gray-100 bg-surface-muted/40 p-4 sm:min-w-[280px] dark:border-white/10 dark:bg-white/5",
                  index === active && "ring-2 ring-sky/30",
                )}
                tabIndex={0}
                onFocus={() => setActive(index)}
              >
                <h4 className="font-heading text-sm font-semibold text-charcoal">{item.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-slate dark:text-muted">{item.body}</p>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-sky-ink dark:text-sky"
                  >
                    Подробнее
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
          <div className="flex gap-1" aria-hidden>
            {filtered.map((item, index) => (
              <button
                key={`${item.title}-dot`}
                type="button"
                className={cn(
                  "h-2 w-2 rounded-full transition",
                  index === active ? "bg-sky" : "bg-gray-200 dark:bg-white/20",
                )}
                onClick={() => setActive(index)}
                aria-label={`Карточка ${index + 1}`}
              />
            ))}
          </div>
        </div>
      ) : (
        <ul
          className={cn(
            "grid gap-3",
            variant === "checklist" || variant === "step-by-step"
              ? "grid-cols-1"
              : "grid-cols-1 sm:grid-cols-2",
          )}
        >
          {filtered.map((item, index) => (
            <li
              key={`${item.title}-${index}`}
              className="rounded-xl border border-gray-100 bg-surface-muted/40 p-3 dark:border-white/10 dark:bg-white/5"
            >
              <p className="font-heading text-sm font-semibold text-charcoal">
                {variant === "step-by-step" ? `${index + 1}. ${item.title}` : item.title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate dark:text-muted">{item.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
