"use client";

import { useMemo, useState } from "react";
import BlogContentTable from "@/components/blog/BlogContentTable";
import { cn } from "@/lib/cn";
import type { BlogComparisonMobileLayout } from "@/types/blog-content-blocks";

type Props = {
  headers: string[];
  rows: string[][];
  highlightColumn?: number;
  caption?: string;
  mobileLayout?: BlogComparisonMobileLayout;
};

export default function BlogComparisonTableBlock({
  headers,
  rows,
  highlightColumn,
  caption,
  mobileLayout = "cards",
}: Props) {
  const [activeTab, setActiveTab] = useState(Math.max(0, highlightColumn ?? 0));
  const optionHeaders = useMemo(() => headers.slice(1), [headers]);

  return (
    <div className="space-y-2" data-editorial-block="comparison-table" data-mobile-layout={mobileLayout}>
      {/* Desktop / tablet: classic table */}
      <div className="hidden md:block">
        <BlogContentTable headers={headers} rows={rows} caption={caption} />
      </div>

      {/* Mobile variants */}
      <div className="md:hidden">
        {mobileLayout === "scroll" ? (
          <BlogContentTable headers={headers} rows={rows} caption={caption} />
        ) : null}

        {mobileLayout === "tabs" && optionHeaders.length > 0 ? (
          <div className="space-y-3">
            {caption ? <p className="text-xs font-semibold uppercase tracking-wide text-slate">{caption}</p> : null}
            <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={caption ?? "Сравнение"}>
              {optionHeaders.map((header, index) => (
                <button
                  key={header}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === index}
                  className={cn(
                    "inline-flex min-h-11 shrink-0 items-center rounded-xl border px-3 text-sm font-medium",
                    activeTab === index
                      ? "border-sky/40 bg-sky/10 text-sky-ink"
                      : "border-gray-200 text-slate",
                  )}
                  onClick={() => setActiveTab(index)}
                >
                  {header}
                </button>
              ))}
            </div>
            <dl className="space-y-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-surface-elevated">
              {rows.map((row) => (
                <div key={`${row[0]}-${activeTab}`} className="border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate">{row[0]}</dt>
                  <dd className="mt-1 text-sm text-charcoal">{row[activeTab + 1] ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}

        {(mobileLayout === "cards" || mobileLayout === "stacked") && optionHeaders.length > 0 ? (
          <div className="space-y-3">
            {caption ? <p className="text-xs font-semibold uppercase tracking-wide text-slate">{caption}</p> : null}
            {optionHeaders.map((header, colIndex) => (
              <article
                key={header}
                className={cn(
                  "rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-surface-elevated",
                  highlightColumn === colIndex + 1 && "ring-2 ring-sky/25",
                )}
              >
                <h4 className="font-heading text-sm font-semibold text-charcoal">{header}</h4>
                <dl className="mt-3 space-y-2">
                  {rows.map((row) => (
                    <div key={`${header}-${row[0]}`}>
                      <dt className="text-xs text-slate">{row[0]}</dt>
                      <dd className="text-sm text-charcoal">{row[colIndex + 1] ?? "—"}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        ) : null}

        {optionHeaders.length === 0 ? (
          <BlogContentTable headers={headers} rows={rows} caption={caption} />
        ) : null}
      </div>
      {highlightColumn != null && highlightColumn >= 0 ? (
        <p className="text-xs text-slate">
          Рекомендуемая колонка:{" "}
          <span className={cn("font-medium text-charcoal")}>
            {headers[highlightColumn] ?? `#${highlightColumn + 1}`}
          </span>
        </p>
      ) : null}
    </div>
  );
}
