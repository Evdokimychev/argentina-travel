"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { TourSectionLink } from "./tour-section-links";

interface TourSectionNavProps {
  items: TourSectionLink[];
}

export default function TourSectionNav({ items }: TourSectionNavProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!items.length) return;

    const sectionElements = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el != null);

    if (!sectionElements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-112px 0px -55% 0px", threshold: [0, 0.1, 0.25] }
    );

    sectionElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    const activeButton = navRef.current?.querySelector<HTMLAnchorElement>(
      `[data-section-id="${activeId}"]`
    );
    activeButton?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeId]);

  if (!items.length) return null;

  return (
    <nav
      ref={navRef}
      aria-label="Разделы страницы тура"
      className="sticky top-[61px] z-30 -mx-4 border-b border-gray-200/80 bg-pampas/95 px-4 py-2.5 backdrop-blur-md sm:-mx-0 sm:rounded-xl sm:border sm:px-3"
    >
      <ul className="scrollbar-hide flex gap-1 overflow-x-auto">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id} className="shrink-0">
              <a
                href={`#${item.id}`}
                data-section-id={item.id}
                onClick={() => setActiveId(item.id)}
                className={cn(
                  "inline-flex rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "bg-patagonia text-white shadow-sm"
                    : "text-slate hover:bg-white hover:text-charcoal"
                )}
                aria-current={active ? "location" : undefined}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
