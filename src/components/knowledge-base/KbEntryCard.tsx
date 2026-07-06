import Link from "next/link";

import { entryHref } from "@/lib/knowledge-base/content";
import { kbTypeLabel } from "@/lib/knowledge-base/labels";
import type { KbEntry } from "@/lib/knowledge-base/types";

/** Карточка записи базы знаний для списков и рекомендаций. */
export default function KbEntryCard({ entry }: { entry: KbEntry }) {
  return (
    <Link
      href={entryHref(entry.id)}
      className="card-hover group flex h-full flex-col rounded-card border border-border-subtle bg-surface-elevated p-4 shadow-card transition-shadow duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 motion-reduce:transition-none"
    >
      <span className="mb-2 inline-flex w-fit items-center rounded-full bg-surface-muted px-2 py-0.5 text-2xs font-medium uppercase tracking-wide text-slate">
        {kbTypeLabel(entry.type)}
      </span>
      <h3 className="mb-1.5 text-base font-semibold leading-snug text-foreground group-hover:text-sky-ink">
        {entry.title}
      </h3>
      {entry.summary && (
        <p className="line-clamp-3 text-sm leading-relaxed text-muted">
          {entry.summary}
        </p>
      )}
    </Link>
  );
}
