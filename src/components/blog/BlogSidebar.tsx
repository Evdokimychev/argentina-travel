"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BlogCard from "@/components/blog/BlogCard";
import BlogReadingHistoryPanel from "@/components/blog/BlogReadingHistoryPanel";
import CollapsibleAsidePanel from "@/components/content/CollapsibleAsidePanel";
import { BLOG_HUB_LINKS } from "@/data/blog-hub-links";
import { cn } from "@/lib/cn";
import type { BlogPost } from "@/types";

type BlogSidebarProps = {
  freshPosts: BlogPost[];
  hubFreshPosts?: BlogPost[];
  hubLabel?: string;
  hubHref?: string;
  /** По умолчанию показывать материалы из хаба, если доступны. */
  defaultHubScope?: boolean;
  readingHistoryExcludeSlug?: string;
  className?: string;
};

const hubLinkIcon = (type: string) => {
  switch (type) {
    case "guide":
      return "📘";
    case "immigration":
      return "🛂";
    case "tour":
      return "🧭";
    default:
      return "📄";
  }
};

export default function BlogSidebar({
  freshPosts,
  hubFreshPosts,
  hubLabel,
  hubHref,
  defaultHubScope = false,
  readingHistoryExcludeSlug,
  className,
}: BlogSidebarProps) {
  const hasHubScope = Boolean(hubFreshPosts?.length && hubLabel);
  const [hubScope, setHubScope] = useState(defaultHubScope && hasHubScope);

  useEffect(() => {
    if (defaultHubScope && hasHubScope) {
      setHubScope(true);
    }
  }, [defaultHubScope, hasHubScope]);

  const displayedFreshPosts =
    hubScope && hubFreshPosts?.length ? hubFreshPosts : freshPosts;

  const freshHint =
    displayedFreshPosts[0]?.title ?? (hubScope && hubLabel ? `Из «${hubLabel}»` : "Свежие материалы");

  return (
    <div className={cn("space-y-4", className)}>
      <BlogReadingHistoryPanel excludeSlug={readingHistoryExcludeSlug} />
      <CollapsibleAsidePanel
        title="Свежее"
        storageKey="blog-sidebar-fresh-collapsed"
        collapsedHint={freshHint}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          {hasHubScope ? (
            <label className="blog-touch-target inline-flex cursor-pointer items-center gap-1.5 text-[11px] text-charcoal">
              <input
                type="checkbox"
                checked={hubScope}
                onChange={(event) => setHubScope(event.target.checked)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-sky focus:ring-sky/30"
              />
              Из «{hubLabel}»
            </label>
          ) : null}
        </div>
        {hubScope && hubHref ? (
          <Link href={hubHref} className="mt-1 inline-block text-[11px] font-medium text-sky hover:underline">
            Все материалы раздела →
          </Link>
        ) : null}
        <div className="mt-3 space-y-1">
          {displayedFreshPosts.map((post) => (
            <BlogCard key={post.id} post={post} variant="compact" />
          ))}
        </div>
      </CollapsibleAsidePanel>

      <CollapsibleAsidePanel
        title="Разделы сайта"
        storageKey="blog-sidebar-sections-collapsed"
        collapsedHint="Путеводитель, туры, иммиграция"
      >
        <ul className="space-y-2">
          {BLOG_HUB_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="blog-touch-target flex flex-col justify-center rounded-xl border border-gray-100 px-3 py-2.5 transition-colors hover:border-sky/25 hover:bg-sky/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
              >
                <span className="text-sm font-medium text-charcoal">
                  {hubLinkIcon(link.type)} {link.label}
                </span>
                {link.description ? (
                  <span className="mt-0.5 block text-xs text-slate">{link.description}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </CollapsibleAsidePanel>
    </div>
  );
}
