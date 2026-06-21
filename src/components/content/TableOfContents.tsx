"use client";

import { useMemo, type MouseEvent } from "react";
import { cn } from "@/lib/cn";
import { scrollToSiteAnchor } from "@/lib/scroll-anchor";
import { hubTocStickyMaxHeightClass, hubTocStickyTopClass } from "@/lib/site-container";
import { useContentTocScrollSpy } from "@/hooks/useContentTocScrollSpy";
import type { ContentTocItem } from "@/types/content-reading";

type TableOfContentsProps = {
  items: ContentTocItem[];
  variant: "sidebar" | "mobile";
  className?: string;
  embedded?: boolean;
};

function handleAnchorClick(id: string) {
  return (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    scrollToSiteAnchor(id);
  };
}

function TocList({
  items,
  activeId,
  mobile = false,
}: {
  items: ContentTocItem[];
  activeId?: string | null;
  mobile?: boolean;
}) {
  if (mobile) {
    return (
      <ol className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => {
          const active = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={handleAnchorClick(item.id)}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "blog-touch-target inline-flex items-center rounded-full border px-3 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 focus-visible:ring-offset-2",
                  item.level === 3 && "ml-2",
                  active
                    ? "border-sky/40 bg-sky/10 font-medium text-sky"
                    : "border-gray-200 bg-surface-muted/60 text-charcoal hover:border-sky/40 hover:text-sky"
                )}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol className="mt-3 space-y-1.5 text-sm">
      {items.map((item) => {
        const active = activeId === item.id;
        return (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={handleAnchorClick(item.id)}
              aria-current={active ? "location" : undefined}
              className={cn(
                "blog-touch-target block rounded-lg px-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 focus-visible:ring-offset-2",
                item.level === 3 ? "pl-5 text-[13px]" : "font-medium",
                active ? "bg-sky/10 text-sky" : "text-slate hover:bg-gray-50 hover:text-charcoal"
              )}
            >
              {item.label}
            </a>
          </li>
        );
      })}
    </ol>
  );
}

function TocSidebar({
  items,
  className,
  embedded = false,
}: {
  items: ContentTocItem[];
  className?: string;
  embedded?: boolean;
}) {
  const activeId = useContentTocScrollSpy(items);

  return (
    <nav
      className={cn(
        "overflow-y-auto rounded-2xl border border-gray-100 bg-white p-5 shadow-card",
        !embedded && hubTocStickyTopClass,
        !embedded && hubTocStickyMaxHeightClass,
        className
      )}
      aria-label="Содержание"
    >
      <p className="font-heading text-sm font-bold text-charcoal">Содержание</p>
      <TocList items={items} activeId={activeId} />
    </nav>
  );
}

function TocMobile({ items, className }: { items: ContentTocItem[]; className?: string }) {
  const activeId = useContentTocScrollSpy(items);
  const activeLabel = useMemo(
    () => items.find((item) => item.id === activeId)?.label ?? items[0]?.label,
    [activeId, items]
  );

  return (
    <nav
      className={cn(
        "sticky z-20 rounded-2xl border border-gray-100 bg-white/95 p-4 shadow-card backdrop-blur-sm lg:hidden",
        hubTocStickyTopClass,
        className
      )}
      aria-label="Содержание"
    >
      <details className="group">
        <summary className="blog-touch-target cursor-pointer list-none rounded-lg font-heading text-sm font-bold text-charcoal marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
          <span className="flex min-w-0 items-center justify-between gap-3">
            <span className="shrink-0">Содержание</span>
            {activeLabel ? (
              <span
                className="min-w-0 flex-1 truncate text-right text-xs font-normal text-slate group-open:hidden"
                aria-hidden
              >
                {activeLabel}
              </span>
            ) : null}
            <span className="shrink-0 text-xs font-normal text-slate group-open:hidden">развернуть</span>
          </span>
        </summary>
        <TocList items={items} activeId={activeId} mobile />
      </details>
    </nav>
  );
}

export default function TableOfContents({ items, variant, className, embedded }: TableOfContentsProps) {
  if (items.length < 2) return null;

  if (variant === "mobile") {
    return <TocMobile items={items} className={className} />;
  }

  return <TocSidebar items={items} className={className} embedded={embedded} />;
}
