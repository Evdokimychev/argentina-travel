"use client";

import { useRef, type Dispatch, type SetStateAction } from "react";
import { MegaMenuTrigger } from "@/components/navigation/MegaMenuTrigger";
import { NavOverflowMegaMenuTrigger } from "@/components/navigation/NavOverflowMegaMenuTrigger";
import { useSiteNavLayout } from "@/hooks/useSiteNavLayout";
import { getActiveNavSectionId } from "@/lib/site-nav";
import type { NavTranslate } from "@/lib/site-nav";
import type { SiteNavSection } from "@/types/site-nav";

type DesktopSiteNavProps = {
  pathname: string;
  t: NavTranslate;
  openMegaMenuId: string | null;
  onOpenMegaMenuChange: Dispatch<SetStateAction<string | null>>;
  sections: SiteNavSection[];
};

export default function DesktopSiteNav({
  pathname,
  t,
  openMegaMenuId,
  onOpenMegaMenuChange,
  sections,
}: DesktopSiteNavProps) {
  const navRef = useRef<HTMLElement>(null);
  const {
    primarySections,
    overflowSections,
    showNavIndex,
    navCompact,
    registerItemRef,
  } = useSiteNavLayout(navRef);

  const allowedIds = new Set(sections.map((section) => section.id));
  const visiblePrimarySections = primarySections.filter((section) => allowedIds.has(section.id));
  const visibleOverflowSections = overflowSections.filter((section) => allowedIds.has(section.id));
  const activeSectionId = getActiveNavSectionId(pathname, sections);
  const overflowNavActive =
    activeSectionId != null &&
    visibleOverflowSections.some((section) => section.id === activeSectionId);

  return (
    <nav
      ref={navRef}
      className="hidden min-w-0 flex-1 items-center justify-center gap-1 overflow-hidden xl:flex xl:gap-1.5 2xl:gap-2"
      aria-label={t("nav.main")}
    >
      {visiblePrimarySections.map((section, index) => (
        <div
          key={section.id}
          ref={registerItemRef(section.id)}
          className="max-w-[9.5rem] shrink-0 2xl:max-w-none"
        >
          <MegaMenuTrigger
            section={section}
            index={index + 1}
            active={activeSectionId === section.id}
            t={t}
            open={openMegaMenuId === section.id}
            showIndex={showNavIndex}
            compact={navCompact}
            onOpenChange={(nextOpen) => {
              if (nextOpen) {
                onOpenMegaMenuChange(section.id);
                return;
              }
              onOpenMegaMenuChange((current) => (current === section.id ? null : current));
            }}
          />
        </div>
      ))}

      {visibleOverflowSections.length > 0 ? (
        <div ref={registerItemRef("overflow")} className="shrink-0">
          <NavOverflowMegaMenuTrigger
            sections={visibleOverflowSections}
            active={overflowNavActive}
            t={t}
            open={openMegaMenuId === "more"}
            compact={navCompact}
            onOpenChange={(nextOpen) => {
              if (nextOpen) {
                onOpenMegaMenuChange("more");
                return;
              }
              onOpenMegaMenuChange((current) => (current === "more" ? null : current));
            }}
          />
        </div>
      ) : null}
    </nav>
  );
}
