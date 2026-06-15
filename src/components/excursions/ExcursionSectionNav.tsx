"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { siteScrollAnchorClass } from "@/lib/site-container";

type SectionLink = {
  id: string;
  label: string;
};

export default function ExcursionSectionNav({ links }: { links: SectionLink[] }) {
  const [activeId, setActiveId] = useState(links[0]?.id ?? "");

  useEffect(() => {
    if (links.length === 0) return;

    const elements = links
      .map((link) => document.getElementById(link.id))
      .filter((element): element is HTMLElement => element != null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) {
          setActiveId(visible.target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5] }
    );

    for (const element of elements) observer.observe(element);
    return () => observer.disconnect();
  }, [links]);

  if (links.length <= 1) return null;

  return (
    <nav
      className={cn(
        "sticky z-20 -mx-4 mb-6 overflow-x-auto border-b border-gray-100 bg-white/95 px-4 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:top-[calc(var(--site-header-height,72px)+0.5rem)] lg:mx-0 lg:px-0",
        siteScrollAnchorClass
      )}
      style={{ top: "calc(var(--site-header-height, 72px) + 0.5rem)" }}
      aria-label="Разделы экскурсии"
    >
      <ul className="flex min-w-max gap-1 py-2">
        {links.map((link) => (
          <li key={link.id}>
            <a
              href={`#${link.id}`}
              className={cn(
                "inline-flex rounded-full px-3 py-1.5 text-sm font-medium transition",
                activeId === link.id
                  ? "bg-sky text-white"
                  : "text-charcoal hover:bg-charcoal/5"
              )}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
