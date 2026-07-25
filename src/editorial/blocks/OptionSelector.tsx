"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import type { BlogEditorialDensity, BlogOptionSelectorItem } from "@/types/blog-content-blocks";

type Props = {
  title?: string;
  description?: string;
  options: BlogOptionSelectorItem[];
  density?: BlogEditorialDensity;
};

export default function OptionSelector({
  title,
  description,
  options,
  density = "comfortable",
}: Props) {
  const labelId = useId();
  const filtered = options.filter((item) => item.id && item.title.trim());
  const [activeId, setActiveId] = useState(filtered[0]?.id ?? "");
  const active = filtered.find((item) => item.id === activeId) ?? filtered[0];

  if (!active) return null;

  return (
    <section
      className={cn(
        "not-prose rounded-2xl border border-gray-100 bg-white dark:border-white/10 dark:bg-surface-elevated",
        density === "compact" ? "p-3" : "p-4 sm:p-5",
      )}
      aria-labelledby={title ? labelId : undefined}
      data-editorial-block="option-selector"
    >
      {title ? (
        <h3 id={labelId} className="font-heading text-base font-semibold text-charcoal">
          {title}
        </h3>
      ) : null}
      {description ? (
        <p className="mt-1 text-sm text-slate dark:text-muted">{description}</p>
      ) : null}

      <div
        className="mt-3 flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label={title ?? "Варианты"}
      >
        {filtered.map((item) => {
          const selected = item.id === active.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center rounded-xl border px-3 text-sm font-medium transition",
                selected
                  ? "border-sky/40 bg-sky/10 text-sky-ink dark:text-sky"
                  : "border-gray-200 text-slate hover:border-sky/30 dark:border-white/15 dark:text-muted",
              )}
              onClick={() => setActiveId(item.id)}
            >
              {item.title}
            </button>
          );
        })}
      </div>

      {/* All options remain in initial HTML for SEO / no-JS readers */}
      <div className="mt-4 space-y-3">
        {filtered.map((item) => (
          <article
            key={item.id}
            role="tabpanel"
            hidden={item.id !== active.id}
            className="rounded-xl border border-gray-100 bg-surface-muted/40 p-4 dark:border-white/10 dark:bg-white/5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="font-heading text-sm font-semibold text-charcoal">{item.title}</h4>
              {item.meta ? (
                <span className="text-xs text-slate dark:text-muted">{item.meta}</span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate dark:text-muted">{item.summary}</p>
            {item.details ? (
              <p className="mt-2 text-sm leading-relaxed text-charcoal/90 dark:text-foreground/90">
                {item.details}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
