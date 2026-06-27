"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import {
  siteContainerClass,
  siteScrollAnchorClass,
  siteStickyBelowHeaderClass,
} from "@/lib/site-container";
import { sectionNavBarClass, sectionNavLinkClass, sectionNavTrackClass } from "@/lib/section-nav-ui";
import { SITE_HEADER_CHROME_CHANGE_EVENT } from "@/lib/site-header-chrome";

type SectionLink = {
  id: string;
  label: string;
};

export default function ExcursionSectionNav({ links }: { links: SectionLink[] }) {
  const navRef = useRef<HTMLElement>(null);
  const [activeId, setActiveId] = useState(links[0]?.id ?? "");

  useEffect(() => {
    if (links.length <= 1) {
      document.documentElement.style.setProperty("--tour-section-nav-height", "0px");
      return () => {
        document.documentElement.style.removeProperty("--tour-section-nav-height");
      };
    }

    const nav = navRef.current;
    if (!nav) return;

    const syncNavHeight = () => {
      const height = nav.offsetHeight;
      if (height > 0) {
        document.documentElement.style.setProperty("--tour-section-nav-height", `${height}px`);
      }
    };

    syncNavHeight();
    const observer = new ResizeObserver(syncNavHeight);
    observer.observe(nav);
    window.addEventListener("resize", syncNavHeight);
    window.addEventListener(SITE_HEADER_CHROME_CHANGE_EVENT, syncNavHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncNavHeight);
      window.removeEventListener(SITE_HEADER_CHROME_CHANGE_EVENT, syncNavHeight);
      document.documentElement.style.removeProperty("--tour-section-nav-height");
    };
  }, [links.length]);

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
