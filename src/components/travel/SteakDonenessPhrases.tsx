"use client";

import { useState } from "react";
import {
  STEAK_DONENESS_ITEMS,
  STEAK_DONENESS_UI,
} from "@/data/steak-doneness-phrases";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  labels?: typeof STEAK_DONENESS_UI;
};

/**
 * Doneness phrasebook. Phrases are always in the DOM; copy is progressive enhancement.
 */
export default function SteakDonenessPhrases({
  className,
  labels = STEAK_DONENESS_UI,
}: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyPhrase = async (id: string, phrase: string) => {
    try {
      await navigator.clipboard.writeText(phrase);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1600);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <section
      className={cn("space-y-3", className)}
      aria-label={labels.ariaLabel}
    >
      <div>
        <h3 className="font-heading text-base font-semibold text-charcoal">{labels.title}</h3>
        <p className="mt-1 text-sm text-slate">{labels.hint}</p>
      </div>

      <ul className="grid gap-2.5 sm:grid-cols-2">
        {STEAK_DONENESS_ITEMS.map((item) => (
          <li
            key={item.id}
            className="flex flex-col rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm"
          >
            <p className="font-heading text-sm font-bold text-charcoal" lang="es">
              {item.term}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate">{item.meaning}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate">{item.caveat}</p>
            <blockquote className="mt-3 rounded-xl bg-surface-muted/50 px-3 py-2 text-sm text-charcoal">
              <p lang="es" className="font-medium">
                {item.phrase}
              </p>
              <p className="mt-1 text-xs text-slate">{item.phraseRu}</p>
            </blockquote>
            <button
              type="button"
              className="blog-touch-target mt-3 inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-sky transition hover:border-sky/40"
              onClick={() => void copyPhrase(item.id, item.phrase)}
            >
              {copiedId === item.id ? labels.copiedLabel : labels.copyLabel}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
