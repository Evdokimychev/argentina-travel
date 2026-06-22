"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CollapsibleAsidePanel from "@/components/content/CollapsibleAsidePanel";
import {
  BLOG_READING_HISTORY_UPDATED_EVENT,
  getBlogReadingHistory,
  getBlogReadingHistoryExcluding,
  type BlogReadingHistoryEntry,
} from "@/lib/blog-reading-history";
import { blogPostPath } from "@/lib/blog-slug-resolve";

type BlogReadingHistoryPanelProps = {
  excludeSlug?: string;
  limit?: number;
};

export default function BlogReadingHistoryPanel({
  excludeSlug,
  limit = 5,
}: BlogReadingHistoryPanelProps) {
  const [entries, setEntries] = useState<BlogReadingHistoryEntry[]>([]);

  useEffect(() => {
    function refresh() {
      setEntries(
        excludeSlug
          ? getBlogReadingHistoryExcluding(excludeSlug, limit)
          : getBlogReadingHistory(limit),
      );
    }

    refresh();
    window.addEventListener(BLOG_READING_HISTORY_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(BLOG_READING_HISTORY_UPDATED_EVENT, refresh);
  }, [excludeSlug, limit]);

  if (entries.length === 0) return null;

  return (
    <CollapsibleAsidePanel
      title="Вы недавно читали"
      storageKey="blog-sidebar-reading-history-collapsed"
      collapsedHint={entries[0]?.title ?? "История чтения"}
    >
      <ul className="space-y-1.5">
        {entries.map((entry) => (
          <li key={entry.slug}>
            <Link
              href={blogPostPath(entry.slug)}
              className="blog-touch-target block rounded-lg px-2 py-1.5 text-sm leading-snug text-slate transition-colors hover:bg-sky/5 hover:text-sky"
            >
              <span className="line-clamp-2">{entry.title}</span>
              {entry.category ? (
                <span className="mt-0.5 block text-2xs text-slate/80">{entry.category}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </CollapsibleAsidePanel>
  );
}
