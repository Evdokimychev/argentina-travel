"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import {
  siteContainerClass,
  siteScrollAnchorClass,
  siteStickyBelowHeaderClass,
} from "@/lib/site-container";
import { sectionNavBarClass, sectionNavLinkClass, sectionNavTrackClass } from "@/lib/section-nav-ui";
import { useSyncSiteSectionNavHeight } from "@/hooks/useSyncSiteSectionNavHeight";

type SectionLink = {
  id: string;
  label: string;
};

export default function ExcursionSectionNav({ links }: { links: SectionLink[] }) {
  const navRef = useRef<HTMLElement>(null);
  const [activeId, setActiveId] = useState(links[0]?.id ?? "");

  useSyncSiteSectionNavHeight(navRef);

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
      ref={navRef}
      className={cn(
        sectionNavBarClass,
        siteStickyBelowHeaderClass,
        siteScrollAnchorClass
      )}
      aria-label="Разделы экскурсии"
    >
      <div
        className={cn(siteContainerClass, "overflow-x-auto overscroll-x-contain py-2.5 sm:py-3")}
      >
        <div className={sectionNavTrackClass}>
          <ul className="flex min-w-max items-center">
            {links.map((link) => (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  className={sectionNavLinkClass(activeId === link.id)}
                  aria-current={activeId === link.id ? "location" : undefined}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
