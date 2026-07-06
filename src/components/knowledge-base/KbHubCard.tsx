import Link from "next/link";

import { entryHref } from "@/lib/knowledge-base/content";
import type { KbEntry } from "@/lib/knowledge-base/types";

const HUB_ICONS: Record<string, string> = {
  "gid-puteshestvennika": "🧭",
  "gid-relokanta": "🧳",
  "gid-po-dengam": "💵",
  "gid-po-dokumentam": "📄",
  "gid-po-zhilyu": "🏘️",
  "gid-po-medicine": "🏥",
  "gid-po-transportu": "🚌",
  "gid-po-kulture": "🎭",
};

/** Крупная карточка тематического хаба (точки входа) для главной. */
export default function KbHubCard({ entry }: { entry: KbEntry }) {
  return (
    <Link
      href={entryHref(entry.id)}
      className="card-hover group flex h-full flex-col rounded-panel border border-border-subtle bg-surface-elevated p-5 shadow-card transition-shadow duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 motion-reduce:transition-none"
    >
      <span aria-hidden className="mb-3 text-2xl">
        {HUB_ICONS[entry.id] ?? "📚"}
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
