import Link from "next/link";

import { entryHref } from "@/lib/knowledge-base/content";
import { getKbEditorialReview } from "@/lib/knowledge-base/editorial";
import { kbTypeLabel } from "@/lib/knowledge-base/labels";
import type { KbEntry } from "@/lib/knowledge-base/types";

/** Карточка записи базы знаний для списков и рекомендаций. */
export default function KbEntryCard({ entry }: { entry: KbEntry }) {
  const hero = entry.media?.hero;
  const editorial = getKbEditorialReview(entry);

  return (
    <Link
      href={entryHref(entry.id)}
      className="card-hover group flex h-full flex-col overflow-hidden rounded-card border border-border-subtle bg-surface-elevated shadow-card transition-shadow duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 motion-reduce:transition-none"
    >
      {hero && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={hero.url}
          alt={hero.alt ?? entry.title}
          loading="lazy"
          className="aspect-[16/9] w-full bg-surface-muted object-cover transition-transform duration-base group-hover:scale-[1.02] motion-reduce:transition-none"
        />
      )}
      <div className="flex flex-1 flex-col p-4">
        <span className="mb-2 inline-flex w-fit items-center rounded-full bg-surface-muted px-2 py-0.5 text-2xs font-medium uppercase tracking-wide text-slate">
          {kbTypeLabel(entry.type)}
        </span>
        {entry.status === "stub" && (
          <span className="mb-2 inline-flex w-fit items-center rounded-full bg-warning-muted px-2 py-0.5 text-2xs font-medium text-warning">
            Короткая справка
          </span>
        )}
        {editorial.needsAttention && (
          <span className="mb-2 inline-flex w-fit items-center rounded-full bg-warning-muted px-2 py-0.5 text-2xs font-medium text-warning">
            Нужна перепроверка
          </span>
        )}
        <h3 className="mb-1.5 text-base font-semibold leading-snug text-foreground group-hover:text-sky-ink">
          {entry.title}
        </h3>
        {entry.summary && (
          <span className="line-clamp-3 text-sm leading-relaxed text-muted">
            {entry.summary}
          </span>
        )}
      </div>
    </Link>
  );
}
