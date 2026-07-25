"use client";

import { useState } from "react";
import {
  TANGO_PHRASEBOOK,
  TANGO_PHRASEBOOK_GROUP_LABELS,
  TANGO_PHRASEBOOK_UI,
  type TangoPhraseGroupId,
} from "@/data/tango-phrasebook";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
};

const GROUP_ORDER: TangoPhraseGroupId[] = [
  "before",
  "invite",
  "roles",
  "consent",
  "watching",
];

/**
 * Spanish phrasebook. Every phrase, translation and context is rendered in the
 * initial HTML and grouped semantically — fully readable with JS disabled.
 * The copy button is progressive enhancement and shows an accessible,
 * polite-live success message.
 */
export default function TangoPhrasebook({ className }: Props) {
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
    <section className={cn("space-y-4", className)} aria-label={TANGO_PHRASEBOOK_UI.ariaLabel}>
      <div>
        <h3 className="font-heading text-base font-semibold text-charcoal">
          {TANGO_PHRASEBOOK_UI.title}
        </h3>
        <p className="mt-1 text-sm text-slate">{TANGO_PHRASEBOOK_UI.hint}</p>
      </div>

      {GROUP_ORDER.map((group) => {
        const items = TANGO_PHRASEBOOK.filter((item) => item.group === group);
        if (items.length === 0) return null;
        return (
          <div key={group} className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate">
              {TANGO_PHRASEBOOK_GROUP_LABELS[group]}
            </h4>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col rounded-2xl border border-gray-100 bg-surface-muted/20 p-3.5"
                >
                  <p lang="es" className="font-medium text-charcoal">
                    {item.phrase}
                  </p>
                  <p className="mt-1 text-sm text-slate">{item.translation}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate/90">{item.context}</p>
                  <button
                    type="button"
                    className="blog-touch-target mt-3 inline-flex min-h-11 items-center justify-center self-start rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-sky transition hover:border-sky/40"
                    onClick={() => void copyPhrase(item.id, item.phrase)}
                  >
                    {copiedId === item.id
                      ? TANGO_PHRASEBOOK_UI.copiedLabel
                      : TANGO_PHRASEBOOK_UI.copyLabel}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      <p className="sr-only" aria-live="polite">
        {copiedId ? TANGO_PHRASEBOOK_UI.copiedLabel : ""}
      </p>
    </section>
  );
}
