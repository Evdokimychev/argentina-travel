"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { BlogEditorialDensity, BlogPhraseItem } from "@/types/blog-content-blocks";

type Props = {
  title?: string;
  category?: string;
  items: BlogPhraseItem[];
  density?: BlogEditorialDensity;
};

export default function Phrasebook({
  title = "Полезные фразы",
  category,
  items,
  density = "comfortable",
}: Props) {
  const filtered = items.filter((item) => item.original.trim() && item.translation.trim());
  const [copied, setCopied] = useState<string | null>(null);

  if (filtered.length === 0) return null;

  async function copyPhrase(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      window.setTimeout(() => setCopied((current) => (current === id ? null : current)), 1600);
    } catch {
      setCopied(null);
    }
  }

  return (
    <section
      className={cn(
        "not-prose rounded-2xl border border-gray-100 bg-white dark:border-white/10 dark:bg-surface-elevated",
        density === "compact" ? "p-3" : "p-4 sm:p-5",
      )}
      data-editorial-block="phrasebook"
      aria-label={title}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-heading text-base font-semibold text-charcoal">{title}</h3>
        {category ? (
          <span className="text-xs uppercase tracking-wide text-slate dark:text-muted">
            {category}
          </span>
        ) : null}
      </div>
      <ul className="mt-3 divide-y divide-gray-100 dark:divide-white/10">
        {filtered.map((item, index) => {
          const id = `${item.original}-${index}`;
          return (
            <li key={id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium text-charcoal" lang="es">
                  {item.original}
                </p>
                {item.pronunciation ? (
                  <p className="mt-0.5 text-xs text-slate dark:text-muted">[{item.pronunciation}]</p>
                ) : null}
                <p className="mt-1 text-sm text-slate dark:text-muted">{item.translation}</p>
                {item.context ? (
                  <p className="mt-1 text-xs text-slate/80 dark:text-muted">{item.context}</p>
                ) : null}
              </div>
              <button
                type="button"
                className="inline-flex min-h-11 shrink-0 items-center rounded-xl border border-gray-200 px-3 text-xs font-medium text-charcoal transition hover:border-sky/40 hover:text-sky-ink dark:border-white/15 dark:text-foreground"
                onClick={() => void copyPhrase(item.original, id)}
              >
                {copied === id ? "Скопировано" : "Копировать"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
