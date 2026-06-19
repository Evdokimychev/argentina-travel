"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { cn } from "@/lib/cn";
import { scrollToSiteAnchor } from "@/lib/scroll-anchor";
import { hubTocStickyMaxHeightClass, hubTocStickyTopClass } from "@/lib/site-container";
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
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={handleAnchorClick(item.id)}
              className={cn(
                "inline-block rounded-full border border-gray-200 bg-surface-muted/60 px-3 py-1.5 text-xs text-charcoal transition-colors hover:border-sky/40 hover:text-sky",
                item.level === 3 && "ml-2"
              )}
            >
              {item.label}
            </a>
          </li>
        ))}
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
                "block rounded-lg px-2 py-1.5 transition-colors",
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
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.25, 0.5] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

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

export default function TableOfContents({ items, variant, className, embedded }: TableOfContentsProps) {
  if (items.length < 2) return null;

  if (variant === "mobile") {
    return (
      <nav
        className={cn(
          "rounded-2xl border border-gray-100 bg-white p-4 shadow-card lg:hidden",
          className
        )}
        aria-label="Содержание"
      >
        <details className="group">
          <summary className="cursor-pointer list-none font-heading text-sm font-bold text-charcoal marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-3">
              Содержание
              <span className="text-xs font-normal text-slate group-open:hidden">развернуть</span>
            </span>
          </summary>
          <TocList items={items} mobile />
        </details>
      </nav>
    );
  }

  return <TocSidebar items={items} className={className} embedded={embedded} />;
}
